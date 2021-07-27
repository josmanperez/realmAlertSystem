exports = async function requestAccessToken() {
  
  console.log("requestAccessToken");
  
  const control = context.services.get('mongodb-atlas').db('Logging').collection('Control');
  const error = context.services.get('mongodb-atlas').db('Logging').collection('Error');
  const public_key = context.values.get("public_key");
  const private_key = context.values.get("private_key_value");

  /** Request a access token and refresh token 
   * 
  */
  const http = context.services.get("httpService");
  return http.post({
    "url": "https://realm.mongodb.com/api/admin/v3.0/auth/providers/mongodb-cloud/login",
    "headers": { 
      "Content-Type": ["application/json"]
    },
    "body": {
      "username": public_key, 
      "apiKey": private_key
    },
    "encodeBodyAsJSON" : true
  })
  .then(response => {
    if (response.statusCode == 200) {
      const ejson_body = JSON.parse(response.body.text());
      if (ejson_body === undefined) {
        error.insertOne({
          date: new Date(),
          code: "Error when accessing an access token object from the JSON response of the ADMIN API",
          message: response
        });
        console.log("requestAccessToken Error");
      } else {
        console.log("Added access token to collection");
        control.insertOne({
          date: new Date(),
          access_token: ejson_body.access_token,
          refresh_token: ejson_body.refresh_token,
          message: ejson_body
        });
        return ejson_body;
      }
    } else {
      error.insertOne({
        date: new Date(),
        code: "Error when creating an access token for the ADMIN API",
        message: response.body.text()
      });
    }    
  })
  .catch(err => {
    error.insertOne({
      date: new Date(),
      code: "Error when calling request token for the ADMIN API",
      message: JSON.stringify(err)
    });
  });
};