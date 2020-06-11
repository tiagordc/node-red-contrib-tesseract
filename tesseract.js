//var Tesseract = require('tesseract.js');
const { createWorker } = require('tesseract.js')
var request = require('request');
var fs = require('fs');
//var path = require("path");

module.exports = function(RED)
{

	async function Recognize(msg) {
		console.log(msg.payload);
		var worker = createWorker();
		console.log('load');
		await worker.load();
		console.log('language');
		await worker.loadLanguage('eng');
		console.log('initialize');
		await worker.initialize('eng');
		console.log('recognize');
		const { data: { text } } = await worker.recognize(msg.payload);
		console.log(text);
		await worker.terminate();
		return text;
	}

	function TesseractNode(config)
	{

		RED.nodes.createNode(this, config);
		this.language = config.language;
		var node = this;

		node.on('input', function(msg)
		{

			// Download URL
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
			// Open file on local file system
			else if (typeof msg.payload == "string")
			{
				if (!fs.existsSync(msg.payload))
				{
					node.error("Referenced image file does not exist.");
					return;
				}
			}
			
			Recognize(msg).then(x => {
				msg.payload = x;
				node.send(msg);
				node.status({});
			}).catch(e => {
				console.log(e);
			})

		});


			// // Update status - Starting
			// node.status({fill: "blue", shape: "dot", text: "performing ocr"});
			// // Initiate Tesseract.js
			// var t = new Tesseract.create(
			// {
			// 	workerPath: path.join(__dirname, "/tesseract.js-overload/worker.js"),
			// 	langPath: "https://github.com/naptha/tessdata/raw/gh-pages/3.02/"
			// });
			// // 
			// // Perform OCR
			// t.recognize(msg.payload, {lang: node.language}).then(function(result)
			// {
			// 	msg.payload = result.text;
			// 	msg.tesseract = 
			// 	{
			// 		text: result.text,
			// 		confidence: result.confidence,
			// 		lines: result.lines.map(l => l = 
			// 		{
			// 			text: l.text,
			// 			confidence: l.confidence,
			// 			words: l.words.map(w => w = 
			// 			{
			// 				text: w.text,
			// 				confidence: w.confidence
			// 			})
			// 		})
			// 	};
			// 	t.terminate();
			// 	node.send(msg);
			// 	// Update status - Done
			// 	node.status({});
			// });
		
	}
	RED.nodes.registerType("tesseract", TesseractNode);
}
