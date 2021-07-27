exports = async function (change_event) {
  
  // Will be called everytime there is an insert/update in the Alert collection

  const alerts = context.services.get('mongodb-atlas').db('Logging').collection('Alert');
  const error = context.services.get('mongodb-atlas').db('Logging').collection('Error');
  
  const numbers = context.values.get("Twilio_Numbers");
  
  const accountSid = context.values.get("Twilio_SID_Value").sid;
  const authToken = context.values.get("Twilio_Auth_Token_Value");
  
  const client = require('twilio')(accountSid, authToken, {
    lazyLoading: true
  });
  
  const body = `A new error has been registered on: ${change_event.fullDocument.processed.date} with error: ${change_event.fullDocument.error.substring(0,90)}...`;
  
  client.messages
  .create({
     body: body,
     from: numbers.from,
     to: numbers.to
   })
  .then(message => {
    console.log(JSON.stringify(message));
    alerts.updateOne({
      _id: new BSON.ObjectId(String(change_event.fullDocument._id))
    },{
      $set: {
        "processed.alerted": true
      }
    });
  })
  .catch(err => {
    error.insertOne({
      date: new Date(),
      code: "Can't send twilio alert SMS",
      message: err
    });
  });
};