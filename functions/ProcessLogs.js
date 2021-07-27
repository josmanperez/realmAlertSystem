exports = async function(arg) {
  
  const alerts = context.services.get('mongodb-atlas').db('Logging').collection('Alert');
  const error = context.services.get('mongodb-atlas').db('Logging').collection('Error');
  
  const { logs } = arg;
  
  if (logs === undefined) {
    return false;
  } 
  
  if (logs.length === 0) {
    return false;
  }
  
  // See if there are already errors being sent to the customer
  const pipeline = [{
    '$sort': {
      "processed.date": -1
    }
  }];
  const results = await alerts.aggregate(pipeline).toArray()
  .then(data => {
    return data;
  })
  .catch(err => {
    error.insertOne({
      date: new Date(),
      code: "Error trying to fetch documents in the alert collection with the aggregation pipeline",
      message: err
    });
    return null;
  });
  if (results === null) {
    return false;
  }
  if (results.length === 0) {
    // There is no error
    const { insertedId } = await alerts.insertOne({
      refId: logs[0]._id,
      co_id: logs[0].co_id,
      app_id: logs[0].app_id,
      group_id: logs[0].group_id,
      started: logs[0].started,
      completed: logs[0].completed,
      error: logs[0].error,
      processed: {
        date: new Date(),
        alerted: false
      }
    });
    return (insertedId !== undefined) ? true : false;
  } else {
    // See if there is a new error registered since last time
    if (logs[0]._id !== results[0].refId) {
      // there is a new error
      const { insertedId } = await alerts.insertOne({
        refId: logs[0]._id,
        co_id: logs[0].co_id,
        app_id: logs[0].app_id,
        group_id: logs[0].group_id,
        started: logs[0].started,
        completed: logs[0].completed,
        error: logs[0].error,
        processed: {
          date: new Date(),
          alerted: false
        }
      });
      return (insertedId !== undefined) ? true : false;
    } else {
      return false;
    }
  }
  
  
  
  
};