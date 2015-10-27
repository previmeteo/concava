#!/bin/sh

(curl context_broker:1026/v1/queryContext -s -S --header 'Content-Type: application/json' \
    --header 'Accept: application/json' -d @- | python -mjson.tool) <<EOF
{
    "entities": [
        {
            "type": "PayloadMapping",
            "isPattern": "false",
            "id": "${1:-1}"
        }
    ]
}
EOF
