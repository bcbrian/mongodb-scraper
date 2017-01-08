echo "#################################"
echo "# STARTING DEV DB AT PORT 27017 #"
echo "#################################"

echo "docker run --rm -it -p 27017:27017 bcbrian/devdb"
docker run --rm -it -p 27017:27017 bcbrian/devdb
