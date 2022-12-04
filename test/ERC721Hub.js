const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const fs = require("fs");

require("hardhat-gas-reporter");

describe("Hub", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function basicDeployment() {
    // Contracts are deployed using the first signer/account by default
    const [deployer, addr1, addr2] = await ethers.getSigners();

    const Hub = await ethers.getContractFactory("SampleERC721Hub");
    const hub = await Hub.deploy();
    await hub.deployed();

    const makeSpoke = await hub.mintWithEth({
      value: ethers.utils.parseUnits(".02", "ether"),
    });
    await makeSpoke.wait();

    const spokeAddress = await hub.spokes(1);
    const spoke = await ethers.getContractAt("ERC721Spoke", spokeAddress);
    console.log("Hub: ", hub.address);
    console.log("Spoke: ", spoke.address);
    console.log("Deployer: ", deployer.address);
    console.log("addr1: ", addr1.address);
    console.log("addr2: ", addr2.address);
    return { hub, spoke, deployer, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should deploy a Hub and two Spokes", async function () {
      const { hub, deployer, spoke } = await loadFixture(basicDeployment);
      console.log(await spoke.ownerOf(1));
      expect(await spoke.ownerOf(1)).to.be.equal(deployer.address);
    });
  });

  it("Should approve and unapprove an address in the Hub and Spoke", async function () {
    const { hub, spoke, deployer, addr1 } = await loadFixture(basicDeployment);

    let tx = await spoke.approve(addr1.address, 1);
    await tx.wait();

    expect(await spoke.getApproved(1)).to.be.equal(addr1.address);
    expect(await hub.getApproved(1)).to.be.equal(addr1.address);

    tx = await spoke.approve(
      ethers.utils.getAddress("0x0000000000000000000000000000000000000000"),
      1
    );
    await tx.wait();

    expect(await spoke.getApproved(1)).to.be.equal(
      "0x0000000000000000000000000000000000000000"
    );
    expect(await hub.getApproved(1)).to.be.equal(
      "0x0000000000000000000000000000000000000000"
    );

    tx = await hub.approve(addr1.address, 1);
    await tx.wait();

    expect(await spoke.getApproved(1)).to.be.equal(addr1.address);
    expect(await hub.getApproved(1)).to.be.equal(addr1.address);

    tx = await hub.approve(
      ethers.utils.getAddress("0x0000000000000000000000000000000000000000"),
      1
    );
    await tx.wait();

    expect(await spoke.getApproved(1)).to.be.equal(
      "0x0000000000000000000000000000000000000000"
    );
    expect(await hub.getApproved(1)).to.be.equal(
      "0x0000000000000000000000000000000000000000"
    );
  });

  it("Should setAll and unsetAll approvals for an address in the Hub and Spoke", async function () {
    const { hub, spoke, deployer, addr1 } = await loadFixture(basicDeployment);

    /* Setting from hub */
    let tx = await hub.setApprovalForAll(addr1.address, true);
    await tx.wait();

    expect(await spoke.isApprovedForAll(deployer.address, addr1.address)).to.be
      .true;
    expect(await hub.isApprovedForAll(deployer.address, addr1.address)).to.be
      .true;

    tx = await hub.setApprovalForAll(addr1.address, false);
    await tx.wait();

    expect(await spoke.isApprovedForAll(deployer.address, addr1.address)).to.be
      .false;
    expect(await hub.isApprovedForAll(deployer.address, addr1.address)).to.be
      .false;

    /* Setting from spoke */
    tx = await spoke.setApprovalForAll(addr1.address, true);
    await tx.wait();
    console.log(await hub.isApprovedForAll(deployer.address, addr1.address));

    expect(await spoke.isApprovedForAll(deployer.address, addr1.address)).to.be
      .true;
    expect(await hub.isApprovedForAll(deployer.address, addr1.address)).to.be
      .true;

    tx = await spoke.setApprovalForAll(addr1.address, false);
    await tx.wait();

    expect(await spoke.isApprovedForAll(deployer.address, addr1.address)).to.be
      .false;
    expect(await hub.isApprovedForAll(deployer.address, addr1.address)).to.be
      .false;
  });

  // describe("Image Creation", function () {
  //   it("Should create a test image", async function () {
  //     const { spoke, deployer } = await loadFixture(basicDeployment);

  //     let pixels = [];
  //     for (let i = 0; i < 2304; i++) {
  //       pixels.push(parseInt(Math.random() * 255));
  //     }

  //     let tx = await spoke.setPixelsAssembly(pixels);

  //     tx.wait();

  //     let test = await spoke.getPixelFromCoords(23, 23);
  //     console.log(test);

  //     // fill it up with random colors
  //     pixels = [];
  //     for (let i = 0; i < 2304; i++) {
  //       pixels.push(parseInt(Math.random() * 255));
  //     }

  //     tx = await spoke.setPixelsAssembly(pixels);
  //     tx.wait();

  //     test = await spoke.getPixelFromCoords(23, 23);
  //     console.log(test);

  //     let svg = await spoke.generateSvg();
  //     // console.log(svg);
  //     fs.writeFile("./test.svg", svg, (err) => {
  //       if (err) {
  //         console.error(err);
  //       }
  //     });

  //     // // console.log(ethers.utils.hexlify([1, 2, 3, 4]));
  //     // const arr = ethers.utils.solidityPack(
  //     //   ["uint8", "uint8", "uint8", "uint8"],
  //     //   [1, 2, 3, 4]
  //     // );
  //     // console.log(arr);
  //   });
  // });
});