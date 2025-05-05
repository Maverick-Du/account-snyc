OUTPUT_DIR=${1}

if [ ! -z $OUTPUT_DIR ]; then
  echo create dir $OUTPUT_DIR
  mkdir -p $OUTPUT_DIR
fi

cp -rf node_modules $OUTPUT_DIR/
cp -rf dist $OUTPUT_DIR/
cp -rf Docker $OUTPUT_DIR/
cp -f package.json $OUTPUT_DIR/
cp -f start.sh $OUTPUT_DIR/
cp -f start_loong64.sh $OUTPUT_DIR/
chmod -R 777 $OUTPUT_DIR/
