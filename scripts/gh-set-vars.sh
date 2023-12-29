key=$(openssl rand -hex 3)

gh variable set BLUE_ENV --body "jp-blue-$key"
gh variable set GREEN_ENV --body "jp-green-$key"
gh variable set PRODUCTION_CNAME --body "jp-main-$key"
gh variable set STAGING_CNAME --body "jp-staging-$key"
