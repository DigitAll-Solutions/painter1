// Starting values for a new location (Studio → New location). Taken from Knoxville, with the business
// name in the consent text replaced by the {locationName} placeholder (filled per location on the form
// and in each lead's consent record). Generated once from Knoxville's published document; edit freely.
export const NEW_LOCATION_DEFAULTS = {
  locationType: 'growth',
  heroSubtitleVariant: 'auto',
  franchiseStructure: 'owner-led',
  ownerPronoun: 'he',
  hasScheduling: false,
  services: {
    interior: {_type: 'serviceDetail', title: 'Interior Painting'},
    exterior: {_type: 'serviceDetail', title: 'Exterior Painting'},
    cabinet: {_type: 'serviceDetail', title: 'Cabinet Refinishing'},
  },
  leadEmailSubject: "Painter1.com - Get Free Estimate - Form Submission",
  leadConfirmationMessage: "Thank you for your message. We will get in touch with you shortly",
  // Fluent Forms #73 notification body (Client Tether parses it). Placeholders only, no addresses.
  leadEmailTemplate: "Url:\n{submission.source_url}\n\nGa Gclid: {inputs.gclid}\n\nGa Source: {inputs.utm_source}\n\nGa Medium: {inputs.utm_medium}\n\nGa Campaign: {inputs.utm_campaign}\n\nFirst Name: {inputs.names.first_name}\n\nLast Name: {inputs.names.last_name}\n\nEmail: {inputs.email}\n\nPhone: {inputs.phone}\n\nAddress: {inputs.input_text}\n\nState: {inputs.input_text_2}\n\nCity: {inputs.input_text_1}\n\nZip Code: {inputs.input_text_3}\n\nMessage:\n{inputs.description}\n\n\n\nClient Tether Parsing Data:\nPARSER: {inputs.channel}, {inputs.channeldrilldown1}, {inputs.channeldrilldown2} ",
  consentBlocks: [
  {
    "_key": "terms-n-condition",
    "_type": "consentBlock",
    "body": [
      {
        "_key": "terms-n-condition-p0",
        "_type": "block",
        "children": [
          {
            "_key": "terms-n-condition-p0s0",
            "_type": "span",
            "marks": [],
            "text": "I have read and agree to the "
          },
          {
            "_key": "terms-n-condition-p0s1",
            "_type": "span",
            "marks": [
              "terms-n-condition-l0"
            ],
            "text": "Terms and Conditions"
          },
          {
            "_key": "terms-n-condition-p0s2",
            "_type": "span",
            "marks": [],
            "text": " and the opt-in below:"
          }
        ],
        "markDefs": [
          {
            "_key": "terms-n-condition-l0",
            "_type": "link",
            "href": "https://www.painter1.com/terms-and-conditions/"
          }
        ],
        "style": "normal"
      },
      {
        "_key": "terms-n-condition-p1",
        "_type": "block",
        "children": [
          {
            "_key": "terms-n-condition-p1s0",
            "_type": "span",
            "marks": [
              "em"
            ],
            "text": "I agree to receive phone calls and emails from {locationName} regarding my estimate request, promotional offers, account updates, and service information. I understand that consent is not required for purchase, and I can opt out anytime by following unsubscribe instructions or contacting you directly."
          }
        ],
        "markDefs": [],
        "style": "normal"
      }
    ],
    "name": "terms-n-condition"
  },
  {
    "_key": "terms-n-condition_1",
    "_type": "consentBlock",
    "body": [
      {
        "_key": "terms-n-condition_1-p0",
        "_type": "block",
        "children": [
          {
            "_key": "terms-n-condition_1-p0s0",
            "_type": "span",
            "marks": [
              "em"
            ],
            "text": "I expressly consent to receive text messages from {locationName} at the mobile number provided. Messages may include estimate details, scheduling updates, promotional offers, and service information (up to 4 messages per month). Message & data rates may apply. I understand that this consent is not required for purchase, and I can opt out anytime by replying STOP or contacting you directly. By checking this box, I confirm that I am the owner of this mobile number and have the authority to provide consent for SMS communications."
          }
        ],
        "markDefs": [],
        "style": "normal"
      },
      {
        "_key": "terms-n-condition_1-p1",
        "_type": "block",
        "children": [
          {
            "_key": "terms-n-condition_1-p1s0",
            "_type": "span",
            "marks": [],
            "text": ""
          }
        ],
        "markDefs": [],
        "style": "normal"
      },
      {
        "_key": "terms-n-condition_1-p2",
        "_type": "block",
        "children": [
          {
            "_key": "terms-n-condition_1-p2s0",
            "_type": "span",
            "marks": [],
            "text": "We will only utilize your personal information to serve business-oriented communications and will never sell your personal information to third parties for their marketing purposes. Communications may be sent using an automated system."
          }
        ],
        "markDefs": [],
        "style": "normal"
      }
    ],
    "name": "terms-n-condition_1"
  }
],
}
