const ADMIN_API_BASE_URL = "https://realm.mongodb.com/api/admin/v3.0";

exports = async function(arg) {
  
  console.log("RequestErrorLogs");
  
  const control = context.services.get('mongodb-atlas').db('Logging').collection('Control');
  const error = context.services.get('mongodb-atlas').db('Logging').collection('Error');
  
  const realm_app = context.values.get("Realm_App");
  const groupId = realm_app.groupId;
  const appId = realm_app.appId;
  
  async function requestLogs(access_token) {
    // Get logs for your Realm App
    const logsEndpoint = `${ADMIN_API_BASE_URL}/groups/${groupId}/apps/${appId}/logs?errors_only=true`;
    const  request = {
      "url": logsEndpoint,
      "headers": {
        "Authorization": [`Bearer ${access_token}`]
      },
      "encodeBodyAsJSON" : true
    };
    return await context.http.get(request)
    .then(response => {
      return response;
    })
    .catch(err => {
      error.insertOne({
        date: new Date(),
        code: "Error when executing request to request logs from the ADMIN API",
        message: JSON.stringify(err),
        error: err
      });
      return null;
    });
  }
  
  const result = await requestLogs(arg.access_token);
  
  const body = ((result.body.text() !== undefined) || (result === null)) ? EJSON.parse(result.body.text()) : "";
  if (result.statusCode === 200) {
    return body;
  } else if (result.statusCode === 401 && body.error_code === "InvalidSession") {
    // The access token is expired, delete the control document to request a new access token next time 
    // Issue a new one using the refresh token.
    console.log("Issue a new access token using the refresh token");
    const token = await context.functions.execute("RefreshAccessToken", arg);
    if (token === "") {
      control.deleteMany({});
    } else {
      const result = await requestLogs(token);
      if (result.statusCode === 200) {
        return body;
      } else {
        control.deleteMany({});
        error.insertOne({
          date: new Date(),
          code: "Error when trying to request logs from the ADMIN API",
          response: JSON.stringify(result),
          message: JSON.stringify(body)
        });
        return "";
      }
    }
    return "";
  } else {
    control.deleteMany({});
    error.insertOne({
      date: new Date(),
      code: "Error when trying to request logs from the ADMIN API",
      response: JSON.stringify(result),
      message: JSON.stringify(result)
    });
    return "";
  }
};