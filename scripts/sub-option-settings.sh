#!/bin/bash -e

export SSL_CERTIFICATE_ARN=$(aws acm list-certificates --query "CertificateSummaryList[?DomainName=='staging.journaling.place'].CertificateArn" --output text)
