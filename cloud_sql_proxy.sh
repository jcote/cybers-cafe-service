#!/bin/bash
export GOOGLE_APPLICATION_CREDENTIALS="/home/nonki/.google/cybers-cafe-cb3ce5122c96.json"
/var/www/cybers-cafe/cybers-cafe-service/cloud_sql_proxy -instances=cybers-cafe:us-east1:cybers-cafe=tcp:3306
