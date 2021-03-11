import * as crypto from 'crypto';


class Transaction {
    constructor(
        public amount: number,
        // Public keys
        public payer: string,
        public payee: string
    ) {
    }

    toString() {
        return JSON.stringify(this);
    }
}

class Block {

    public nonce = Math.round(Math.random() * 999999999);

    constructor(
        public prevHash: string,
        public transaction: Transaction,
        public ts = Date.now()
    ) {
    }

    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }
}

class Chain {
    // Should only be one blockchain, so we have to make a singleton instance.
    public static instance = new Chain();

    // Property for the chain itself - array of blocks.
    chain: Block[];

    constructor() {
        // Let's make money out of thin air, lol.
        // FYI: First block of the chain is called Genesis block.
        // @ts-ignore
        this.chain = [new Block(null, new Transaction(100, 'Payer', 'Payee'))]
    }

    // Grab the last block of the chain.
    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }

    mine(nonce: number) {
        let solution = 1;
        console.log('⛏️ Currently mining...')

        while(true) {
            const hash = crypto.createHash('MD5');
            hash.update((nonce + solution).toString()).end();

            const attempt = hash.digest('hex');

            if (attempt.substr(0,4) === '0000') {
                console.log(`Solved: ${solution}.`);
                return solution;
            }
            solution +=1
        }

    }

    // Verify before adding new block
    addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer) {
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());

        const isValid = verifier.verify(senderPublicKey, signature);

        if (isValid) {
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.mine(newBlock.nonce);
            this.chain.push(newBlock);
        }
    }
}

class Wallet {
    public publicKey: string; // Receive money
    public privateKey: string; // Make transfers

    // RSA (RIVEST-SHAMIR-ADLEMAN) to generate both keys.
    // Allows to encrypt and decrypt with a key unlike SHA256.
    constructor() {
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {type: 'spki', format: 'pem'},
            privateKeyEncoding: {type: 'pkcs8', format: 'pem'}
        });
        this.publicKey = keypair.publicKey;
        this.privateKey = keypair.privateKey;
    }


    sendMoney(amount: number, payeePublicKey: string) {
        const transaction = new Transaction(amount, this.publicKey, payeePublicKey);

        const sign = crypto.createSign('SHA256')
        sign.update(transaction.toString()).end();

        const signature = sign.sign(this.privateKey);
        Chain.instance.addBlock(transaction, this.publicKey, signature);
    }

}

// Usage
const X = new Wallet();
const Y = new Wallet();
const Z = new Wallet();

X.sendMoney(100, Y.publicKey);
Y.sendMoney(100, Z.publicKey);
Z.sendMoney(100, X.publicKey);

