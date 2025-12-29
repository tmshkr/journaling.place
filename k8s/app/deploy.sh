#!/bin/bash -e
if [ -f skaffold.env ]; then
	source skaffold.env
	echo "Loaded environment variables from skaffold.env"
fi

required_vars=(
	EMAIL_FROM
	EMAIL_SECRET
	EMAIL_SERVER
	IMAGE_TAG
	NEXTAUTH_SECRET
	NEXTAUTH_URL
	MONGO_URI
	PRISMA_QUERY_ENGINE_LIBRARY
	TARGET_DOMAIN
	TEST_USER_EMAIL
)

for var in "${required_vars[@]}"; do
	if [ -z "${!var}" ]; then
		echo "Error: $var is not set."
		has_missing_var=true
	fi
done

if [ "$has_missing_var" = true ]; then
	exit 1
fi

skaffold deploy --images tmshkr/journaling.place:${IMAGE_TAG}
export TARGET_DOMAIN
export TARGET_SERVICE="jp-${IMAGE_TAG}"
envsubst <cf-ingress.template.yaml | kubectl apply -n default -f -

echo "${TARGET_DOMAIN} --> ${TARGET_SERVICE}"
