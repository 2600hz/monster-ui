#!/bin/bash

YUI_PATH=~/src/yuicompressor-2.4.7/build/yuicompressor-2.4.7.jar
WH_PATH=whapps/$1
TEMP=/tmp

JS=$WH_PATH/$1.app.js
TEMPLATE=$WH_PATH/$1.tmpl.js
CSS=$WH_PATH/$1.css.js
MINIFIED=$WH_PATH/$1-min.js

TEMP=/tmp
TIME=`date +%s`
TEMP_SRC=$TEMP/$1.src-$TIME.js

# JS
echo "Preparing JavaScript..."

cat $WH_PATH/$1.js $WH_PATH/*/*.js > $JS

echo "Complete!"

# TEMPLATE

echo "Generating template JavaScript..."

echo "(function(winkstart, templates) {" > $TEMPLATE
echo "    templates['$1'] = {};" >> $TEMPLATE
for i in `ls $WH_PATH/*/tmpl/*.html`; do
    echo "    templates['$1']['${i#$WH_PATH/}'] = \$(\"`perl -pe 's/^\s+//g;s/\s+$//g;s/\n//g;s/\"/\\\\\"/g;' $i`\");" >> $TEMPLATE
done

echo "})(window.winkstart = window.winkstart || {}, window.winkstart.templates = window.winkstart.templates || {});" >> $TEMPLATE

echo "Complete!"

# CSS

echo "Generating CSS JavaScript..."

echo "(function(winkstart, css) {" > $CSS
echo "    css['$1'] = {};" >> $CSS
for i in `ls $WH_PATH/*/css/*.css`; do
    # Resolve relative path
    CSS_PATH=`echo "${i%/*.css}/" | perl -pe 's/\//\\\\\//g'`

    # Replace CSS relative url paths, then minify, then escape quotes
    CMD=`perl -pe "s/url\(['\"]?([^'\"\)]+)['\"]?\)/url\($CSS_PATH\1\)/g;" $i | \
         java -jar $YUI_PATH --type css | \
         perl -pe 's/\"/\\\\\"/g;'`
    echo "    css['$1']['${i#$WH_PATH/}'] = \$(\"<style type=\\\"text/css\\\">$CMD</style>\");" >> $CSS
done

echo "})(window.winkstart = window.winkstart || {}, window.winkstart.css = window.winkstart.css || {});" >> $CSS

echo "Complete!"

# MINIFY

echo "Merging into a massive file..."
cat $CSS $TEMPLATE $JS > $TEMP_SRC
echo "Complete!"

echo "Beginning minification..."
java -jar $YUI_PATH --type js -o $MINIFIED $TEMP_SRC
echo "All done! Minified copy: $MINIFIED"
