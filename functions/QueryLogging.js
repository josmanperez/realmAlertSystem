exports = async function() {
  
  const control = context.services.get('mongodb-atlas').db('Logging').collection('Control');
  const error = context.services.get('mongodb-atlas').db('Logging').collection('Error');
  
  /** Error class
   * 
  */
  class NoTokenError extends Error {
    constructor(args){
        super(args);
        this.name = "NoTokenError";
    }
  }
  
  /** Retrieve the last access and refresh token stored in the Control Collection 
   *
  */
  const pipeline = [{
    '$sort': {
      'date': -1
    }
  }, {
    '$limit': 1
  }];
  const data = await control.aggregate(pipeline).toArray()
  .then(data => {
    return data;
  })
  .catch(err => {
    error.insertOne({
      date: new Date(),
      code: "Error querying the collection for accessing the last access token registered",
      message: err
    });
  });
  var logs = {};
  if (data == null || data.length === 0) {
    // There is no access token registered
    const token = await context.functions.execute("RequestAccessToken");
    logs = await context.functions.execute("RequestErrorLogs", token);
  } else {
    logs = await context.functions.execute("RequestErrorLogs", data[0]);
  }
  await context.functions.execute("ProcessLogs", logs);
};