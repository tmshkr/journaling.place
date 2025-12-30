#!/bin/bash -e

if [ "$1" != "--dry-run=false" ]; then
	dry_run=true
else
	dry_run=false
fi

prod_deployment=$(
	kubectl get ingresses journaling.place -o jsonpath="{.spec.rules[0].http.paths[0].backend.service.name}"
)

echo "Production deployment: ${prod_deployment}"

deployments_to_delete=$(
	kubectl get deployments \
		-l app.kubernetes.io/name=journaling-place \
		--field-selector metadata.name!=${prod_deployment} -o jsonpath="{.items[*].metadata.name}"
)

if [ -z "$deployments_to_delete" ]; then
	echo "No deployments to delete."
	exit 0
fi

echo deployments_to_delete:
for deployment in ${deployments_to_delete[@]}; do
	echo "$deployment"
done

for deployment in ${deployments_to_delete[@]}; do
	export RELEASE_NAME=$deployment
	if [ "$dry_run" = false ]; then
		echo "Deleting ${RELEASE_NAME} ..."
		skaffold delete
	else
		skaffold delete --dry-run
	fi
done
