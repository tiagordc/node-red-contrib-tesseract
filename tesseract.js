const { createWorker, OEM, PSM } = require('tesseract.js')
const request = require('request');
const fs = require('fs');

module.exports = function(RED) {

	function TesseractNode(config) {

		RED.nodes.createNode(this, config);
		const worker = createWorker();

		let node = this;
		let isReady = false;
		let options = { tessedit_ocr_engine_mode: OEM.DEFAULT, tessedit_pageseg_mode: PSM.SINGLE_BLOCK, tessedit_char_whitelist: config.chars };

		(async ()=> {
			await worker.load();
			await worker.loadLanguage(config.language);
			await worker.initialize(config.language);
			await worker.setParameters(options);
			isReady = true;
		})();

		node.on('input', function(msg) {

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