import { dasherize } from '@angular-devkit/core/src/utils/strings';
import chalk from 'chalk';
import * as inquirer from 'inquirer';
import { Answers, PromptModule, Question } from 'inquirer';
import { Input } from '../commands';
import { AbstractPackageManager, PackageManager, PackageManagerFactory } from '../lib/package-managers';
import { generateInput, generateSelect } from '../lib/questions/questions';
import { AbstractCollection, Collection, CollectionFactory, SchematicOption } from '../lib/schematics';
import { messages } from '../lib/ui';
import { AbstractAction } from './abstract.action';

export class NewAction extends AbstractAction {
  public async handle(inputs: Input[], options: Input[]) {
    const questions: Question[] = generateQuestionsForMissingInputs(inputs);
    const answers: Answers = await askForMissingInformation(questions);
    const args: Input[] = replaceInputMissingInformation(inputs, answers);
    await generateApplicationFiles(inputs, options);
    const shouldSkipInstall = options.some((option) => option.name === 'skip-install' && option.value === true);
    if (!shouldSkipInstall) {
      await installPackages(inputs, options);
    }
  }
}

const generateQuestionsForMissingInputs = (inputs: Input[]): Question[] => {
  return inputs
    .map((input) => generateInput(input.name)(input.value)(generateDefaultAnswer(input.name)))
    .filter((question) => question !== undefined) as Array<Question<Answers>>;
};

const generateDefaultAnswer = (name: string) => {
  switch (name) {
    case 'name':
      return 'nestjs-app-name';
    case 'description':
      return 'description';
    case 'version':
      return '0.0.0';
    case 'author':
    default:
      return '';
  }
};

const askForMissingInformation = async (questions: Question[]): Promise<Answers> => {
  console.info();
  console.info(messages.PROJECT_INFORMATION_START);
  console.info(messages.ADDITIONAL_INFORMATION);
  console.info();
  const prompt: PromptModule = inquirer.createPromptModule();
  const answers: Answers = await prompt(questions);
  console.info();
  console.info(messages.PROJECT_INFORMATION_COLLECTED);
  console.info();
  return answers;
};

const replaceInputMissingInformation = (inputs: Input[], answers: Answers): Input[] => {
  return inputs.map((input) => input.value = input.value !== undefined ? input.value : answers[ input.name ]);
};

const generateApplicationFiles = async (args: Input[], options: Input[]) => {
  const collection: AbstractCollection = CollectionFactory.create(Collection.NESTJS);
  const schematicOptions: SchematicOption[] = mapSchematicOptions(args.concat(options));
  await collection.execute('application', schematicOptions);
  await generateConfigurationFile(args, options, collection);
  console.info();
};

const mapSchematicOptions = (options: Input[]): SchematicOption[] => {
  return options.reduce((schematicOptions: SchematicOption[], option: Input) => {
    if (option.name !== 'skip-install' && option.value !== 'package-manager') {
      schematicOptions.push(new SchematicOption(option.name, option.value));
    }
    return schematicOptions;
  }, []);
};

const generateConfigurationFile = async (args: Input[], options: Input[], collection: AbstractCollection) => {
  const schematicOptions: SchematicOption[] = mapConfigurationSchematicOptions(args.concat(options));
  schematicOptions.push(new SchematicOption('collection', '@nestjs/schematics'));
  await collection.execute('configuration', schematicOptions);
};

const mapConfigurationSchematicOptions = (inputs: Input[]): SchematicOption[] => {
  return inputs.reduce((schematicsOptions: SchematicOption[], option: Input) => {
    if (option.name === 'name') {
      schematicsOptions.push(new SchematicOption('project', dasherize(option.value as string)));
    }
    if (option.name === 'language') {
      schematicsOptions.push(new SchematicOption(option.name, option.value));
    }
    return schematicsOptions;
  }, []);
};

const installPackages = async (inputs: Input[], options: Input[]) => {
  const installDirectory = dasherize(inputs.find((input) => input.name === 'name')!.value as string);
  const dryRunMode = options.find((option) => option.name === 'dry-run')!.value as boolean;
  const inputPackageManager: string = options.find((option) => option.name === 'package-manager')!.value as string;
  let packageManager: AbstractPackageManager;
  if (dryRunMode) {
    console.info();
    console.info(chalk.green(messages.DRY_RUN_MODE));
    console.info();
    return;
  }
  if (inputPackageManager !== undefined) {
    try {
      packageManager = PackageManagerFactory.create(inputPackageManager);
      await packageManager.install(installDirectory);
    } catch (error) {
      console.error(chalk.red(error.message));
    }
  } else {
    packageManager = await selectPackageManager();
    await packageManager.install(installDirectory);
  }
};

const selectPackageManager = async (): Promise<AbstractPackageManager> => {
  const answers: Answers = await askForPackageManager();
  return PackageManagerFactory.create(answers[ 'package-manager' ]);
};

const askForPackageManager = async (): Promise<Answers> => {
  const questions: Question[] = [
    generateSelect('package-manager')(messages.PACKAGE_MANAGER_QUESTION)([ PackageManager.NPM, PackageManager.YARN ]),
  ];
  const prompt = inquirer.createPromptModule();
  return await prompt(questions);
};
