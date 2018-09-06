const { assertRevert } = require('../../helpers/assertRevert');
const ERC20Pausable = artifacts.require('ERC20PausableMock');

contract('ERC20Pausable', function ([_, pauser, recipient, anotherAccount]) {
  beforeEach(async function () {
    this.token = await ERC20Pausable.new(pauser, 100, { from: pauser });
  });

  describe('pause', function () {
    describe('when the sender is the token pauser', function () {
      const from = pauser;

      describe('when the token is unpaused', function () {
        it('pauses the token', async function () {
          await this.token.pause({ from });
          (await this.token.paused()).should.equal(true);
        });

        it('emits a Pause event', async function () {
          const { logs } = await this.token.pause({ from });

          logs.length.should.equal(1);
          logs[0].event.should.equal('Paused');
        });
      });

      describe('when the token is paused', function () {
        beforeEach(async function () {
          await this.token.pause({ from });
        });

        it('reverts', async function () {
          await assertRevert(this.token.pause({ from }));
        });
      });
    });

    describe('when the sender is not the token pauser', function () {
      const from = anotherAccount;

      it('reverts', async function () {
        await assertRevert(this.token.pause({ from }));
      });
    });
  });

  describe('unpause', function () {
    describe('when the sender is the token pauser', function () {
      const from = pauser;

      describe('when the token is paused', function () {
        beforeEach(async function () {
          await this.token.pause({ from });
        });

        it('unpauses the token', async function () {
          await this.token.unpause({ from });
          (await this.token.paused()).should.equal(false);
        });

        it('emits an Unpause event', async function () {
          const { logs } = await this.token.unpause({ from });

          logs.length.should.equal(1);
          logs[0].event.should.equal('Unpaused');
        });
      });

      describe('when the token is unpaused', function () {
        it('reverts', async function () {
          await assertRevert(this.token.unpause({ from }));
        });
      });
    });

    describe('when the sender is not the token pauser', function () {
      const from = anotherAccount;

      it('reverts', async function () {
        await assertRevert(this.token.unpause({ from }));
      });
    });
  });

  describe('pausable token', function () {
    const from = pauser;

    describe('paused', function () {
      it('is not paused by default', async function () {
        (await this.token.paused({ from })).should.equal(false);
      });

      it('is paused after being paused', async function () {
        await this.token.pause({ from });
        (await this.token.paused({ from })).should.equal(true);
      });

      it('is not paused after being paused and then unpaused', async function () {
        await this.token.pause({ from });
        await this.token.unpause({ from });
        (await this.token.paused()).should.equal(false);
      });
    });

    describe('transfer', function () {
      it('allows to transfer when unpaused', async function () {
        await this.token.transfer(recipient, 100, { from: pauser });

        (await this.token.balanceOf(pauser)).should.be.bignumber.equal(0);
        (await this.token.balanceOf(recipient)).should.be.bignumber.equal(100);
      });

      it('allows to transfer when paused and then unpaused', async function () {
        await this.token.pause({ from: pauser });
        await this.token.unpause({ from: pauser });

        await this.token.transfer(recipient, 100, { from: pauser });

        (await this.token.balanceOf(pauser)).should.be.bignumber.equal(0);
        (await this.token.balanceOf(recipient)).should.be.bignumber.equal(100);
      });

      it('reverts when trying to transfer when paused', async function () {
        await this.token.pause({ from: pauser });

        await assertRevert(this.token.transfer(recipient, 100, { from: pauser }));
      });
    });

    describe('approve', function () {
      it('allows to approve when unpaused', async function () {
        await this.token.approve(anotherAccount, 40, { from: pauser });

        (await this.token.allowance(pauser, anotherAccount)).should.be.bignumber.equal(40);
      });

      it('allows to transfer when paused and then unpaused', async function () {
        await this.token.pause({ from: pauser });
        await this.token.unpause({ from: pauser });

        await this.token.approve(anotherAccount, 40, { from: pauser });

        (await this.token.allowance(pauser, anotherAccount)).should.be.bignumber.equal(40);
      });

      it('reverts when trying to transfer when paused', async function () {
        await this.token.pause({ from: pauser });

        await assertRevert(this.token.approve(anotherAccount, 40, { from: pauser }));
      });
    });

    describe('transfer from', function () {
      beforeEach(async function () {
        await this.token.approve(anotherAccount, 50, { from: pauser });
      });

      it('allows to transfer from when unpaused', async function () {
        await this.token.transferFrom(pauser, recipient, 40, { from: anotherAccount });

        (await this.token.balanceOf(pauser)).should.be.bignumber.equal(60);
        (await this.token.balanceOf(recipient)).should.be.bignumber.equal(40);
      });

      it('allows to transfer when paused and then unpaused', async function () {
        await this.token.pause({ from: pauser });
        await this.token.unpause({ from: pauser });

        await this.token.transferFrom(pauser, recipient, 40, { from: anotherAccount });

        (await this.token.balanceOf(pauser)).should.be.bignumber.equal(60);
        (await this.token.balanceOf(recipient)).should.be.bignumber.equal(40);
      });

      it('reverts when trying to transfer from when paused', async function () {
        await this.token.pause({ from: pauser });

        await assertRevert(this.token.transferFrom(pauser, recipient, 40, { from: anotherAccount }));
      });
    });

    describe('decrease approval', function () {
      beforeEach(async function () {
        await this.token.approve(anotherAccount, 100, { from: pauser });
      });

      it('allows to decrease approval when unpaused', async function () {
        await this.token.decreaseApproval(anotherAccount, 40, { from: pauser });

        (await this.token.allowance(pauser, anotherAccount)).should.be.bignumber.equal(60);
      });

      it('allows to decrease approval when paused and then unpaused', async function () {
        await this.token.pause({ from: pauser });
        await this.token.unpause({ from: pauser });

        await this.token.decreaseApproval(anotherAccount, 40, { from: pauser });

        (await this.token.allowance(pauser, anotherAccount)).should.be.bignumber.equal(60);
      });

      it('reverts when trying to transfer when paused', async function () {
        await this.token.pause({ from: pauser });

        await assertRevert(this.token.decreaseApproval(anotherAccount, 40, { from: pauser }));
      });
    });

    describe('increase approval', function () {
      beforeEach(async function () {
        await this.token.approve(anotherAccount, 100, { from: pauser });
      });

      it('allows to increase approval when unpaused', async function () {
        await this.token.increaseApproval(anotherAccount, 40, { from: pauser });

        (await this.token.allowance(pauser, anotherAccount)).should.be.bignumber.equal(140);
      });

      it('allows to increase approval when paused and then unpaused', async function () {
        await this.token.pause({ from: pauser });
        await this.token.unpause({ from: pauser });

        await this.token.increaseApproval(anotherAccount, 40, { from: pauser });

        (await this.token.allowance(pauser, anotherAccount)).should.be.bignumber.equal(140);
      });

      it('reverts when trying to increase approval when paused', async function () {
        await this.token.pause({ from: pauser });

        await assertRevert(this.token.increaseApproval(anotherAccount, 40, { from: pauser }));
      });
    });
  });
});
