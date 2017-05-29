import {GenerateCommandDescriptor} from '../../command-descriptors/generate.command-descriptor';
import {CaporalProgram} from '../../../core/caporal/caporal.program';
import {Program} from '../../../common/interfaces/program.interface';
import {Command} from '../../../common/interfaces/command.interface';
import * as sinon from 'sinon';
import {expect} from 'chai';
import {GenerateCommandHandler} from '../../handlers/generate-command.handler';

describe('GenerateCommandDescriptor', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  let command: Command;
  beforeEach(() => {
    const program: Program = new CaporalProgram();
    command = program.command('name', 'description');
  });

  describe('#declare()', () => {
    let aliasStub: sinon.SinonStub;
    let argumentStub: sinon.SinonStub;
    let optionStub: sinon.SinonStub;
    let handlerStub: sinon.SinonStub;
    beforeEach(() => {
      aliasStub = sandbox.stub(command, 'alias').callsFake(() => command);
      argumentStub = sandbox.stub(command, 'argument').callsFake(() => command);
      optionStub = sandbox.stub(command, 'option').callsFake(() => command);
      handlerStub = sandbox.stub(command, 'handler').callsFake(() => command);
    });

    beforeEach(() => {
      GenerateCommandDescriptor.declare(command);
    });

    it('should declare the command alias g', () => {
      expect(aliasStub.calledWith('g')).to.be.true;
    });

    it('should declare the mandatory asset argument with the right description', () => {
      expect(argumentStub.calledWith('<asset>', 'The generated asset type')).to.be.true;
    });

    it('should declare the mandatory name argument with the right description', () => {
      expect(argumentStub.calledWith('<name>', 'The generated asset name')).to.be.true;
    });

    it('should declare the optional destination argument with the right description', () => {
      expect(argumentStub.calledWith('[destination]', 'The generated asset root relative path')).to.be.true;
    });

    it('should call handler() with the GenerateCommandHandler', () => {
      expect(handlerStub.calledWith(new GenerateCommandHandler())).to.be.true;
    });
  });
});