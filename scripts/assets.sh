helm repo add eks https://aws.github.io/eks-charts --force-update
helm pull eks/aws-load-balancer-controller --untar --untardir assets
curl -o assets/2048_full.yaml https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.7.2/docs/examples/2048/2048_full.yaml
