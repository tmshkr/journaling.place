#!/bin/bash -e

export SSL_CERTIFICATE_ARN=$(aws acm list-certificates --query "CertificateSummaryList[?DomainName=='staging.journaling.place'].CertificateArn" --output text)

echo $(envsubst <option-settings.json) >option-settings.json
echo APP_VERSION=$GITHUB_REF_NAME-$TAG >>.env
echo ENVIRONMENT=$ENVIRONMENT >>.env
echo SHA=$GITHUB_SHA >>.env
echo TAG=$TAG >>.env
zip -r bundle.zip . -x '*.git*'
