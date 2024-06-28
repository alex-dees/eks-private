# Private EKS Cluster


This example deploys the [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/latest) and [2048 game](https://play2048.co/) into a private eks cluster using local assets.

## Install

Follow [instructions](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html) to install CDK and bootstrap your account. &nbsp;You will also need a container image tool such as [Crane](https://github.com/google/go-containerregistry/blob/main/cmd/crane/README.md) or Docker.

## Assets

The assets for creating the ALB Controller and game have already been included in the assets folder by running `./scripts/assets.sh`

## Images

Run the script below to retrieve images for the ALB Controller and game. &nbsp;The images are pushed to ECR and accessed through a VPC endpoint.
```
# choose a new or existing ECR repo
repo=eks-private

# use crane to pull the public images and push them to ECR
./scripts/images.sh $repo
```

