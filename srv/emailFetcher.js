const Imap = require('imap');
const { inspect } = require('util');
const cds = require('@sap/cds'); 
const { v4: uuidv4 } = require('uuid');
const { Email } = this.entities;


// Define the MailAttachmentFetcher class
class MailAttachmentFetcher {
    constructor(emailConfig) {
        this.emailConfig = emailConfig;
        this.imap = new Imap(this.emailConfig);
        this.imap.once('ready', this.onImapReady.bind(this));
        this.imap.once('error', this.onImapError.bind(this));
        this.imap.once('end', this.onImapEnd.bind(this));
        this.emailDataMap = new Map();
    }

    onImapReady() {
        console.log('Connection established.');
        this.imap.openBox('INBOX', true, this.onOpenBox.bind(this));
    }

    onImapError(err) {
        console.error('IMAP error:', err);
        throw err;
    }

    onImapEnd() {
        console.log('Connection ended.');
    }

    async onOpenBox(err, box) {
        if (err) {
            console.error('Error opening INBOX:', err);
            throw err;
        }

        console.log('INBOX opened successfully.');

        // Fetch the most recent 100 messages
        const fetch = this.imap.seq.fetch(`${box.messages.total - 99}:${box.messages.total}`, {
            bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
            struct: true
        });

        fetch.on('message', (msg, seqno) => {
            const prefix = '(#' + seqno + ') ';
            let attrs;
            let emailData;

            msg.on('body', (stream, info) => {
                let buffer = '';
                stream.on('data', chunk => {
                    buffer += chunk.toString('utf8');
                });
                stream.once('end', async () => {
                    const header = Imap.parseHeader(buffer);
                    console.log(prefix + 'Parsed header: %s', inspect(header));

                    const getHeaderValue = (headerArray) => headerArray && headerArray.length > 0 ? headerArray[0].trim() : '';

                    const from = getHeaderValue(header.from);
                    const to = getHeaderValue(header.to);
                    const dateStr = getHeaderValue(header.date);
                    const subject = getHeaderValue(header.subject);

                    let emailDate, emailTime;
                    try {
                        const dateTime = new Date(dateStr);
                        if (isNaN(dateTime.getTime())) {
                            throw new Error('Invalid date');
                        }
                        emailDate = dateTime.toISOString().split('T')[0];
                        emailTime = dateTime.toTimeString().split(' ')[0];
                    } catch (e) {
                        console.error('Error parsing date:', e);
                        emailDate = null;
                        emailTime = null;
                    }

                    emailData = {
                        ID: uuidv4(),
                        date: emailDate,
                        time: emailTime,
                        subject: subject,
                        frm: from,
                        to: to
                    };

                    await cds.run(INSERT.into('Email').entries(emailData));
                });
            });

            msg.once('attributes', async (attrsData) => {
                attrs = attrsData;
                const attachments = [];
                const parts = attrs.struct;
                this.parseParts(parts, attachments);

                emailData = this.emailDataMap.get(attrs.uid);
                if (!emailData) {
                    console.error('Email data not found for UID:', attrs.uid);
                    return;
                }

                for (const attachment of attachments) {
                    const fetch = this.imap.fetch(attrs.uid, { bodies: [attachment.partID], struct: true });

                    fetch.on('message', (msg) => {
                        msg.on('body', async (stream) => {
                            let data = '';
                            stream.on('data', chunk => {
                                data += chunk.toString('utf8');
                            });
                            stream.once('end', async () => {
                                let buffer;
                                if (attachment.encoding.toUpperCase() === 'BASE64') {
                                    buffer = Buffer.from(data, 'base64');
                                } else {
                                    buffer = Buffer.from(data, 'binary');
                                }

                                const attachmentData = {
                                    ID: uuidv4(),
                                    filename: attachment.filename,
                                    data: buffer,
                                    email_ID: emailData.ID
                                };

                                await cds.run(INSERT.into('IMAPConfiguration.Attachments').entries(attachmentData));
                                console.log(`Saved attachment: ${attachment.filename}`);
                            });
                        });
                    });
                }
            });

            msg.once('end', () => {
                console.log(prefix + 'Finished');
            });
        });

        fetch.once('error', (err) => {
            console.log('Fetch error: ' + err);
        });

        fetch.once('end', () => {
            console.log('Done fetching all messages!');
            this.imap.end();
        });
    }

    parseParts(parts, attachments) {
        parts.forEach(part => {
            if (Array.isArray(part)) {
                this.parseParts(part, attachments);
            } else {
                if (part.disposition && part.disposition.type === 'ATTACHMENT') {
                    attachments.push({
                        partID: part.partID,
                        filename: part.disposition.params.filename,
                        encoding: part.encoding
                    });
                }
            }
        });
    }

    start() {
        return new Promise((resolve, reject) => {
            this.imap.once('end', resolve);
            this.imap.connect();
        });
    }
}

// Export the async function
module.exports = async (req) => {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

    const emailConfig = {
        user: 'sivababu7872@gmail.com',
        password: 'edkv nqqr wlvm ggih',
        host: 'imap.gmail.com',
        port: 993,
        tls: true
    };

    const mailFetcher = new MailAttachmentFetcher(emailConfig);
    await mailFetcher.start();

    // Fetch 100 most recent emails, ordered by date (most recent first)
    return await cds.run(SELECT.from('Email').orderBy('date desc').limit(100));
};
