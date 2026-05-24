data "aws_iam_role" "this" {
  name = "LabRole"
}

module "this" {
  source = "terraform-aws-modules/lambda/aws"

  function_name = var.function_name

  create_role = false

  attach_cloudwatch_logs_policy      = false
  attach_create_log_group_permission = false

  lambda_role = data.aws_iam_role.this.arn

  handler = "index.handler"
  runtime = "nodejs${var.nodejs_version}"

  source_path = {
    path     = var.root_dir
    commands = ["npm ci", "npm run build", ":zip ./dist"]
  }

  environment_variables = var.environment_variables
}
