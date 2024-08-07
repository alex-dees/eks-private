import * as cdk from 'aws-cdk-lib';
import { Construct } from "constructs";
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as iam from 'aws-cdk-lib/aws-iam';
import { KubectlV29Layer } from '@aws-cdk/lambda-layer-kubectl-v29';

export interface ClusterProps extends cdk.StackProps {
    vpc: ec2.IVpc,
    master?: iam.IRole
    bastion?: ec2.BastionHostLinux
}

export class Cluster extends eks.Cluster {
    constructor(scope: Construct, id: string, props: ClusterProps) {
        const vpc = props.vpc;
        const bastion = props.bastion;
        super(scope, id, {
            vpc,
            mastersRole: props.master,
            placeClusterHandlerInVpc: true,
            version: eks.KubernetesVersion.V1_29,
            endpointAccess: eks.EndpointAccess.PRIVATE,
            vpcSubnets: [{ subnets: vpc.isolatedSubnets }],
            kubectlEnvironment: {
                // use vpc endpoint, not the global
                "AWS_STS_REGIONAL_ENDPOINTS": 'regional'
            },
            kubectlLayer: new KubectlV29Layer(scope, 'Kubectl')
        });
        
        if (bastion) {
            this.awsAuth.addMastersRole(bastion?.role);
            this.connections.allowFrom(bastion, ec2.Port.allTcp());
        }
    }
}