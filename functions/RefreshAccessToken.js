exports = async function(arg) {
  
  const control = context.services.get('mongodb-atlas').db('Logging').collection('Control');
  const error = context.services.get('mongodb-atlas').db('Logging').collection('Error');
  
  const { refresh_token, _id } = arg;
  
  if (refresh_token === undefined || _id === undefined) {
    error.insertOne({
      date: new Date(),
      code: "Trying to call RefreshAccessToken without providing the required arguments",
      message: null
    });
    return "";
  }
  
  // Refresh access token
  const  request = {
    "url": "https://realm.mongodb.com/api/admin/v3.0/auth/session",
    "headers": {
      "Authorization": [`Bearer ${refresh_token}`],
      "Content-Type" : ["application/json"]
    },
    "encodeBodyAsJSON" : true
  };
  const result = await context.http.post(request)
  .then(response => {
    return response;
  })
  .catch(err => {
    // Insert the error
    error.insertOne({
      date: new Date(),
      code: "Error when trying to refresh the access token with the refresh token ADMIN API",
      message: err
    });
  });
  const body = EJSON.parse(result.body.text());
  if (result.statusCode === 201) {
    // Save new access token in the control document
    control.updateOne(
      {_id: new BSON.ObjectId(String(arg._id)) },
      {$set: {
        access_token: body.access_token,
        last_modified: new Date()
      }
    });
    return body.access_token;
  } else {
    error.insertOne({
      date: new Date(),
      code: "Error in the response when trying to refresh the access token with the refresh token ADMIN API",
      message: body
    });
    return "";
  }
};