#!/bin/bash
export GOOGLE_APPLICATION_CREDENTIALS="/home/latte/.google/Cybers Cafe-cc5478d309c4.json"
/home/latte/cloud_sql_proxy -instances=cybers-cafe:us-east1:cybers-cafe=tcp:3306
