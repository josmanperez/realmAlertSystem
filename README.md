# Alert system with Twlio for Realm Applications

## Motivation

This tutorial is focused on those developers who have a [Realm](https://medium.com/r/?url=https%3A%2F%2Fwww.mongodb.com%2Frealm) application and want to create an alert monitoring system that sends an SMS every time a new error appears in our application.

Currently, there are three ways to access the logs of our system:

1. **Through the Logs section of our graphical interface**: From here we will be able to access the logs and we will be able to filter between the different origins, dates, etc.
2. **Using the Admin API Rest**: this will allow us to request the logs of an application programmatically by accessing the logging endpoints of the Realm Admin API.
3. Through the command interface tools or `realm-cli`

In this tutorial, we will create a monitoring system that will use a schedule trigger to monitor the Logs through the Admin API and when it detects a new error, it will send a message to a registered phone number to receive the error and be alerted of it using Twilio.

Let's assume that you have already created a [MongoDB Atlas](https://medium.com/r/?url=https%3A%2F%2Fwww.mongodb.com%2Fcloud%2Fatlas) account.

## Prerequisites

1. Have already created a MongoDB Atlas account and an associated cluster. https://www.mongodb.com/cloud/atlas/register
2. Have a Twilio account. https://www.twilio.com/

## Overview

The system is composed of several parts that we will explain below:

![diagram](https://cdn-images-1.medium.com/max/800/0*XHvnLO2S--1iwUry)

1. **Schedule Trigger**: This trigger will be in charge of monitoring our Admin API to request the error logs. Here it is important to define the monitoring time so that this time will be the delay that we will have between a new error that arises in our application and the alert message that we will receive. For this tutorial, the monitoring is indicated every 10 minutes.

2. **MongoDB collection for monitoring**: We have created a new database called "Logging" where we will store the three collections we need for our alert monitoring system. 
    1. **Control collection**: We will use this collection to store the access_token and the refresh_token needed to make the requests to our Admin API. The access_token is valid for half an hour, so the refresh_token will be automatically used to generate a new token every time it expires and it will be stored in this collection. We will be able to consult the last_modified property to consult the date of the last access_token renewal request.
    2. **Error Collection**: We will use this collection to store any error derived from the requests to our Admin API.
    3. **Alert Collection**: We will use this collection to store the last error log of our application that we have not yet processed and sent via SMS to our phone.

3. **Database Trigger**: The function of this trigger is to monitor the Alert collection, every time a new document is introduced in this collection, this trigger will be in charge of sending an alert to the phone numbers configured through Twilio.










