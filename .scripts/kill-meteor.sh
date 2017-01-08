echo "###############"
echo "# KILL METEOR #"
echo "###############"

echo "kill -9 `ps ax | grep node | grep meteor | grep -v atom | awk '{print $1}'`"
kill -9 `ps ax | grep node | grep meteor | grep -v atom | awk '{print $1}'`
