import { IPixelRendr } from "../../src/IPixelRendr";
import { mochaLoader } from "../main";
import { stubPixelRendr } from "../utils/fakes";

mochaLoader.it("copies members of an array of equal length", (): void => {
    // Arrange
    const pixelRender: IPixelRendr = stubPixelRendr();
    const receiver: number[] = [0, 0, 0];
    const donor: number[] = [2, 3, 5];

    // Act
    pixelRender.memcpyU8(donor, receiver);

    // Assert
    chai.expect(donor).to.deep.equal(receiver);
});

mochaLoader.it("does not copy to an array of length 0", (): void => {
    // Arrange
    const PixelRender: IPixelRendr = stubPixelRendr();
    const receiver: number[] = [];
    const donor: number[] = [2, 3, 5];

    // Act
    PixelRender.memcpyU8(donor, receiver);

    // Assert
    chai.expect(receiver).to.deep.equal([]);
});

mochaLoader.it("does not change receiver if donor has length 0", (): void => {
    // Arrange
    const PixelRender: IPixelRendr = stubPixelRendr();
    const receiver: number[] = [0, 0, 0];
    const donor: number[] = [];

    // Act
    PixelRender.memcpyU8(donor, receiver);

    // Assert
    chai.expect(receiver).to.deep.equal([0, 0, 0]);
});

mochaLoader.it("copies all of the donor's elements if its length is less than the receiver's", (): void => {
    // Arrange
    const PixelRender: IPixelRendr = stubPixelRendr();
    const receiver: number[] = [0, 0, 0];
    const donor: number[] = [2, 3];

    // Act
    PixelRender.memcpyU8(donor, receiver);

    // Assert
    chai.expect(receiver).to.deep.equal([2, 3, 0]);
});

mochaLoader.it("changes all of the receiver's elements if its length is less than the donor's", (): void => {
    // Arrange
    const PixelRender: IPixelRendr = stubPixelRendr();
    const receiver: number[] = [0, 0];
    const donor: number[] = [2, 3, 5];

    // Act
    PixelRender.memcpyU8(donor, receiver);

    // Assert
    chai.expect(receiver).to.deep.equal([2, 3]);
});