# Merging process

To update this repository with the latest changes from the upstream repo [@digitalbazaar/cborld](https://github.com/digitalbazaar/cborld) library, we need to follow the following steps.

### 1) Create a new branch off upstream master

```bash
# Add main repo as remote
git remote add up https://github.com/digitalbazaar/cborld
git fetch up
git checkout up/main

# Checkout a new branch replacing the latest package version and push new branch
 git checkout -b cborld-release-<latest-version>
 git push origin cborld-release-<latest-version>
```

### 2) Create a PR titled `Release @digitalbazaar/cborld <latest-version>`

**Important:**

- Fix all the conflicts. We need to make sure we don't remove updates made by us, so if unsure while merging changes, please ask someone else help
- Review pull request as per normal and ensure all merge checks pass

### 3) Merge PR to master and [release](./release.md)

- Unfortunately, we will not be able to keep the individual commits made on the upstream repo as soon as we make a change to our master branch. Make sure, the merging message includes the PR title.
