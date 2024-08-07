import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { Construct } from 'constructs';
import * as eks from 'aws-cdk-lib/aws-eks';

interface GameProps{
    cidr: string,
    repo: string,
    certArn: string,
    cluster: eks.Cluster
}

export class Game extends Construct{
  private manifest: any[];

  constructor(scope: Construct, id: string, private props: GameProps) {
    super(scope, id);
    this.load();
    this.configImg();
    this.configSvc();
    this.rmIngress();
    this.deploy();
  }
  
  private load() {
    this.manifest = <any[]>yaml.loadAll(
      fs.readFileSync('assets/2048_full.yaml', 'utf8'));
  }

  // ingress creates alb, we want nlb (service)
  private rmIngress() {
    const i = this.manifest.findIndex(m => m.kind == 'Ingress');
    this.manifest.splice(i, 1);
  }

  private configImg() {
    const d = this.manifest.find(m => m.kind == 'Deployment');
    d.spec.template.spec.containers[0].image = `${this.props.repo}:game`;
  }

  // https://kubernetes-sigs.github.io/aws-load-balancer-controller/v2.2/guide/service/annotations/  
  private configSvc() {
    const { cidr, certArn } = this.props;
    const s = this.manifest.find(m => m.kind == 'Service');
    s.spec.type = 'LoadBalancer';
    s.spec.loadBalancerSourceRanges = [ cidr ];
    s.spec.ports = [{
      port: 443,
      targetPort: 80,
      protocol: 'TCP'
    }];    
    s.metadata.annotations = {
      'service.beta.kubernetes.io/aws-load-balancer-type': 'external',
      'service.beta.kubernetes.io/aws-load-balancer-nlb-target-type': 'ip',
      'service.beta.kubernetes.io/aws-load-balancer-ssl-cert': certArn
    };
  }

  private deploy() {
    const cluster = this.props.cluster;

    const km = new eks.KubernetesManifest(this, 'GameMfst', {
      cluster,
      manifest: this.manifest
    });

    if (cluster.albController) km.node.addDependency(cluster.albController);
  }
}