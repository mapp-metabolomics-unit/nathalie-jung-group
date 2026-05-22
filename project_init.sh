#!/bin/bash

echo "Starting project initialization script..."

# Print the current working directory
echo "Current working directory: $PWD"

# Exit immediately if a command exits with a non-zero status
set -e

# Initialize git repository only if not already initialized
if [ ! -d .git ]; then
    git init
    echo "Git repository initialized."
else
    echo "Git repository already initialized."
fi

# Check if remote origin already exists
if git remote -v | grep -q origin; then
    echo "Remote origin already exists."
    exit 0
else
    git remote add origin "https://github.com/mapp-metabolomics-unit/nathalie-jung-group.git"
    echo "Remote origin added."
fi

# Add all files to git
git add .
echo "Files added to git."

# Commit the files
git commit -m "Initial commit"
echo "Files committed."

# Push to the remote repository
git push -u origin main
echo "Pushed to remote repository."

echo "Project initialization script completed."
