echo "###################################"
echo "# START METEOR AND COPY DB PROCESS#"
echo "###################################"

echo "meteor & node ./imports/dbScraper.js && ./.scripts/kill-meteor.sh && ./.scripts/build-docker.sh"
meteor & node ./imports/dbScraper.js && ./.scripts/kill-meteor.sh && ./.scripts/build-docker.sh
