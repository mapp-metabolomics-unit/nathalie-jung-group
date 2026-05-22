#!/bin/bash

echo "not doing anything ..."
# echo "Starting project pull script..."
# echo "Current working directory: $PWD"

# # Check if the project has already been initialized
# if [ ! -d .git/ ]; then
#   echo "This project is not initialized. Or the scripts runs at step 1 (before moving to the templated repo). Exiting."
#   exit 0
# fi

# # Pull the latest changes from remote if it's an update
# git fetch origin
# if [ $? -ne 0 ]; then
#     echo "Failed to fetch changes from remote"
#     exit 1
# fi

# git merge origin/main
# if [ $? -ne 0 ]; then
#     echo "Failed to merge changes from remote"
#     exit 1
# fi
# echo "Merged changes from remote."

# # Add all files to git
# git add .
# if [ $? -ne 0 ]; then
#     echo "Failed to add files to git"
#     exit 1
# fi
# echo "Files added to git."

# # Commit the changes
# git commit -m "Update from template"
# if [ $? -ne 0 ]; then
#     echo "Failed to commit changes"
#     exit 1
# fi
# echo "Changes committed."

# # Push to the remote repository
# git push -u origin main
# if [ $? -ne 0 ]; then
#     echo "Failed to push to remote repository"
#     exit 1
# fi
# echo "Pushed to remote repository."

# echo "Project pull script completed."
