set -e
set -a; source .env; set +a

for file in ./nginx/*.template
do
  envsubst < "$file" > "${file%.template}"
done