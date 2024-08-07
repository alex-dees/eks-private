import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3Assets from 'aws-cdk-lib/aws-s3-assets';

export class Bastion extends Construct {
  readonly host : ec2.BastionHostLinux;

  constructor(scope: Construct, id: string, vpc: ec2.IVpc) {
    super(scope, id);
    
    this.host = new ec2.BastionHostLinux(this, 'Bastion', { 
      vpc,
      requireImdsv2: true,
      machineImage: ec2.MachineImage.latestAmazonLinux2023({ 
        userData: this.userData()
      })
    });
    
    this.host.role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'));
  }

  private userData() {
    const ud = ec2.UserData.forLinux();
    const asset = new s3Assets.Asset(this, 'KubectlAsset', {
      path: 'assets/kubectl'
    });

    ud.addS3DownloadCommand({
      bucket: asset.bucket,
      bucketKey: asset.s3ObjectKey,
      localFile: '/tmp/kubectl'
    });

    ud.addCommands(
      'chmod +x /tmp/kubectl',
      'cp /tmp/kubectl /usr/local/bin'
    );

    return ud;
  }  
}