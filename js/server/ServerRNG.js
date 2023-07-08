const crypto = require("crypto");

class ServerRNG {
    seed;

    setInitialSeed(s) {
        let seedBuffer = crypto.createHash("sha256").update(Buffer.from(s, "utf-8")).digest();
        this.seed = this.reduce(seedBuffer);
    }

    reduce(arr) {
        let m = 1;
        let f = 2;
        let t = 0;
        //for(let a of arr) {  // The seed cannot be too large because javascript doesn't support long integers.
        for(let i = 0; i < 16; i++) {
            t += m * arr[i];
            m *= f;
        }

        return t;
    }

    getRandomInteger(arr, max) {
        this.seed += this.reduce(arr);
        return this.nextInt(max);
    }

    nextInt(n) {
        // Returns a random int [0, n)
        if((n & -n) === n) { // i.e., n is a power of 2
            return ((n * this.next(31)) >> 31);
        }
    
        let bits;
        let val;
        do {
            bits = this.next(31);
            val = bits % n;
        }
        while(bits - val + (n - 1) < 0);

        return val;
    }

    next(bits) {
        // To avoid negative values for the seed, use BigInt to do the calculation and then revert back to a regular Number.
        //this.seed = Number(BigInt(this.seed * 0x5DEECE66D + 0xB) & BigInt(281474976710655));

        this.seed = (this.seed * 0x5DEECE66D + 0xB) & 281474976710655;
        return this.seed >>> (48 - bits);
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("!V!", 1)
            .serialize("seed", this.seed)
        .endObject();
    }

    static deserialize(reader) {
        let serverRNG;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            serverRNG = new ServerRNG();
            serverRNG.seed = reader.deserialize("seed", "Number");
        }
        else {
            throw("Unknown version number: " + version);
        }

        reader.endObject();
        return serverRNG;
    }
}

module.exports = ServerRNG;