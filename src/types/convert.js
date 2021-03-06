import int24 from 'int24'

function nativeConverter (method, length) {
	return function (name) {
		this.data.setValue(name, this.buffer[method](this.pointer))
		this.pointer += length
	}
}

function native24BitConverter (littleEndian, unsigned) {
	var method = 'read' + (unsigned ? 'U' : '') + 'Int24' + (littleEndian ? 'LE' : 'BE')
	return function (name) {
		this.data.setValue(name, int24[method](this.buffer, this.pointer))
		this.pointer += 3
	}
}

function native64BitConverter (littleEndian, unsigned) {
	return function (name) {
		var sign  = (unsigned || this.buffer[this.pointer] & 0x80 === 0x80 ? 1 : -1)
		var value = (Math.pow(2, 32) * this.buffer.readInt32BE (this.pointer + (littleEndian ? 4 : 0))) +
			(sign * this.buffer.readUInt32BE(this.pointer + (littleEndian ? 0 : 4)))
		this.data.setValue(name, value)
		this.pointer += 8
	}
}

const int8 = nativeConverter('readInt8', 1)
const uint8 = nativeConverter('readUInt8', 1)

export default {
	int8: int8,
	int8le: int8,
	int8be: int8,
	uint8: uint8,
	uint8le: uint8,
	uint8be: uint8,
	int16le: nativeConverter('readInt16LE', 2),
	int16be: nativeConverter('readInt16BE', 2),
	uint16le: nativeConverter('readUInt16LE', 2),
	uint16be: nativeConverter('readUInt16BE', 2),
	int24le: native24BitConverter(true, false),
	int24be: native24BitConverter(false, false),
	uint24le: native24BitConverter(true, true),
	uint24be: native24BitConverter(false, true),
	int32le: nativeConverter('readInt32LE', 4),
	int32be: nativeConverter('readInt32BE', 4),
	uint32le: nativeConverter('readUInt32LE', 4),
	uint32be: nativeConverter('readUInt32BE', 4),
	int64le: native64BitConverter(true, false),
	int64be: native64BitConverter(false, false),
	uint64le: native64BitConverter(true, true),
	uint64be: native64BitConverter(false, true),
	floatle: nativeConverter('readFloatLE', 4),
	floatbe: nativeConverter('readFloatBE', 4),
	doublele: nativeConverter('readDoubleLE', 8),
	doublebe: nativeConverter('readDoubleBE', 8),

	skip (name, length) {
		this.pointer += parseInt(length)
	},
}
