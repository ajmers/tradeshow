if git diff HEAD^ HEAD --quiet ./app; then exit 0; else exit 1; fi
