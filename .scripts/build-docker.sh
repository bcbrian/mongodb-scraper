echo "#####################################"
echo "# COPYING Dockerfile TO DB LOCATION #"
echo "#####################################"

echo "cp Dockerfile ./.meteor/local"
cp Dockerfile ./.meteor/local

echo "###################################"
echo "# CHANGE DIRECTORY TO DB LACATION #"
echo "###################################"
ls -la
echo "cd ./.meteor/local"
cd ./.meteor/local && ls -la

echo "########################"
echo "# GET DOCKER USER NAME #"
echo "########################"

DOCKER_USER_NAME=$(docker info | sed '/Username:/!d;s/.* //');
echo $DOCKER_USER_NAME

echo "################"
echo "# BUILD DOCKER #"
echo "################"
ls -la
echo "docker build -t $DOCKER_USER_NAME/devdb ."
docker build -t $DOCKER_USER_NAME/devdb .

echo "#####################################"
echo "# CHANGE DIRECTORY BACK TO APP ROOT #"
echo "#####################################"

echo "cd ../../"
cd ../../
