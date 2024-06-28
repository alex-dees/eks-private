# example:  ./images.sh my-repo

region=$(aws configure list | grep region | awk '{print $2}')
account=$(aws sts get-caller-identity --query 'Account' --output text)
registry=$account.dkr.ecr.$region.amazonaws.com

crane pull public.ecr.aws/l6m2t8p7/docker-2048:latest game.tar
crane pull public.ecr.aws/eks/aws-load-balancer-controller:v2.8.1 albc.tar

aws ecr get-login-password | crane auth login -u AWS --password-stdin $registry

# create repo if it doesn't exist, ignore errors
aws ecr create-repository --repository-name $1 &> /dev/null || true

crane push game.tar $registry/$1:game
crane push albc.tar $registry/$1:albc

rm game.tar albc.tar