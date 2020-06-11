const { createWorker } = require('tesseract.js')
const request = require('request');
const fs = require('fs');

module.exports = function(RED)
{

	function TesseractNode(config)
	{

		RED.nodes.createNode(this, config);
		this.language = config.language;
		var node = this;

		const worker = createWorker();
		let isReady = false;

		(async ()=> {
			await worker.load();
			await worker.loadLanguage('eng');
			await worker.initialize('eng');
			isReady = true;
		})();

		node.on('input', function(msg)
		{

			if (/^http(s?):\/\//.test(msg.payload))
			{
				request({url:msg.payload, encoding: null}, function(err, res, body)
				{
					if (err)
					{
						node.error("Encountered error while downloading image file. " + err.message);
						return;
					}
					msg.payload = body;
					Recognize(msg);
				});
			}
			else if (typeof msg.payload == "string")
			{
				if (!fs.existsSync(msg.payload))
				{
					node.error("Referenced image file does not exist.");
					return;
				}
			}

			(async (img) => {
				if (isReady) {
				  	const { data: { text } } = await worker.recognize(img);
					msg.payload = text;
					node.send(msg);
				}
			})(msg.payload);
			
		});
		
	}
	RED.nodes.registerType("tesseract", TesseractNode);
}
