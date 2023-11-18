import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cf from "aws-cdk-lib/aws-cloudfront";
import * as deployment from "aws-cdk-lib/aws-s3-deployment";

const app = new cdk.App();

const stack = new cdk.Stack(app, "AndreyPotkasRSSFrontStack", {
  env: { region: "eu-west-1" },
});

const bucket = new s3.Bucket(stack, "AndreyPotkasRSSFrontBucket", {
  bucketName: "andrey-potkas-rss-front",
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
  websiteIndexDocument: "index.html",
  publicReadAccess: false,
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
});

const originAccessIdentity = new cf.OriginAccessIdentity(
  stack,
  "AndreyPotkasRSSFrontBucketOAI"
);

bucket.grantRead(originAccessIdentity);

const distribution = new cf.CloudFrontWebDistribution(
  stack,
  "AndreyPotkasRSSFrontDistribution",
  {
    originConfigs: [
      {
        s3OriginSource: {
          s3BucketSource: bucket,
          originAccessIdentity: originAccessIdentity,
        },
        behaviors: [{ isDefaultBehavior: true }],
      },
    ],
    viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    defaultRootObject: "index.html",
    errorConfigurations: [
      {
        errorCode: 404,
        responseCode: 200,
        responsePagePath: "/index.html",
      },
    ],
  }
);

new deployment.BucketDeployment(stack, "AndreyPotkasRSSFrontDeployment", {
  destinationBucket: bucket,
  sources: [deployment.Source.asset("./dist")],
  distribution,
  distributionPaths: ["/*"],
});

new cdk.CfnOutput(stack, "S3bucket Url", {
  value: bucket.bucketWebsiteUrl,
});

new cdk.CfnOutput(stack, "Cloudfront Url", {
  value: distribution.distributionDomainName,
});
