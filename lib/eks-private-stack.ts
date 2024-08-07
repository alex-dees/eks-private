import { Albc } from './albc';
import { Game } from './game';
import * as cdk from 'aws-cdk-lib';
import { Bastion } from './bastion';
import { Cluster } from './cluster';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as r53 from 'aws-cdk-lib/aws-route53';
import { KubectlV29Layer } from '@aws-cdk/lambda-layer-kubectl-v29';

interface Context {
  role: string,
  repo: string,
  domain: string,
  certArn: string
}

export interface EksPrivateProps extends cdk.StackProps{
  vpc: ec2.IVpc
}

export class EksPrivateStack extends cdk.Stack {
  private context: any;
  private cluster: Cluster;

  constructor(scope: Construct, id: string, private props: EksPrivateProps) {
    super(scope, id, props);    
    this.context = this.node.tryGetContext('app');
    this.deploy();
    this.addDns();
  }

  private deploy() {
    const vpc = this.props.vpc;
    const { role, repo, certArn } = this.context;

    this.cluster = new Cluster(this, 'Cluster', {
      vpc,
      bastion: new Bastion(this, 'Bastion', vpc).host,
      master: iam.Role.fromRoleName(this, 'Master', role)
    });

    new Albc(this, 'Albc', {
      repo,
      cluster: this.cluster,
    });
    
    new Game(this, 'Game', {
      repo,
      certArn,
      cluster: this.cluster,
      cidr: vpc.vpcCidrBlock
    });
  }

  private addDns() {
    // e.g. sub.example.com
    const dom = this.context.domain.split('.');
    const zone = new r53.PrivateHostedZone(this, 'Zone', {
      vpc: this.props.vpc,
      zoneName: dom.slice(1).join('.')
    });
    
    const lb = this.cluster.getServiceLoadBalancerAddress('service-2048', { 
      namespace: 'game-2048'
    });

    new r53.CnameRecord(this, 'Cname', {
      zone,
      domainName: lb,
      recordName: dom[0]
    });
  }
}
