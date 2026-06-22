import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';
import User from './models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error("MONGODB_URI not found!");
    process.exit(1);
}

const splMatches = [
  { splName: "KarthikaRajeswari ", splEmail: "rajeswarikarthiga143@gmail.com", splMobile: "7339672373" },
  { splName: "Ravivarman A", splEmail: "ravivarmancse31@gmail.com", splMobile: "7395884718" },
  { splName: "Jayakumar S", splEmail: "jayakumar1532003@gmail.com", splMobile: "9384492469" },
  { splName: "Gopiga K", splEmail: "gopigakannan@gmail.com", splMobile: "9786079117" },
  { splName: "Kalpitaa M G ", splEmail: "mgkalpitaa@gmail.com", splMobile: "9043013271" },
  { splName: "Prem Kumar M", splEmail: "m.premkumar2503@gmail.com", splMobile: "6383411026" },
  { splName: "Nithyasri k", splEmail: "nithyanithya3993@gmail.com", splMobile: "6369346836" },
  { splName: "Selladurai J", splEmail: "selladurai1904@gmail.com", splMobile: "9363223513" },
  { splName: "Rubini B ", splEmail: "rubinibalusamy@gmail.com", splMobile: "9965111393" },
  { splName: "GOWTHAMAN R", splEmail: "gowthammathu7@gmail.com", splMobile: "8015272190" },
  { splName: "Durga GB ", splEmail: "durgagb21@gmail.com", splMobile: "9994038535" },
  { splName: "THOLKAPPIYAN S", splEmail: "tkpandiyan2000@gmail.com", splMobile: "7806882827" },
  { splName: "Mohamed Kasim", splEmail: "kasim151000@gmail.com", splMobile: "9025897581" },
  { splName: "Dinesh K", splEmail: "kdineshuchb@gmail.com", splMobile: "9500851314" },
  { splName: "Priya Darshini", splEmail: "priyakeerthy0807@gmail.com", splMobile: "6363131752" },
  { splName: "Chandru s", splEmail: "chandrusuriya49@gmail.com", splMobile: "8220687692" },
  { splName: "Suresh R", splEmail: "ss9477157@gmail.com", splMobile: "6369722581" },
  { splName: "Saradha S", splEmail: "saradhasundharesan@gmail.com", splMobile: "7845203108" },
  { splName: "R. Rajbharath", splEmail: "rbharath552@gmail.com", splMobile: "8015985611" },
  { splName: "Subalakshmi K", splEmail: "subakannan1409@gmail.com", splMobile: "8438552690" },
  { splName: "Rajalakshmi S", splEmail: "rajselva65588@gmail.com", splMobile: "6383780501" },
  { splName: "Ramesh", splEmail: "rameshmanohar2001m@gmail.com", splMobile: "7010251221" },
  { splName: "Visvesvaran G", splEmail: "visvesvaran62@gmail.com", splMobile: "7708402766" },
  { splName: "Aswitha ", splEmail: "aswithavijayakumar1120@gmail.com", splMobile: "7305197294" },
  { splName: "Kavi Arasan", splEmail: "kaviarasan7778@gmail.com", splMobile: "6385538234" },
  { splName: "Brammanayagan S", splEmail: "sakthibrammanayagan@gmail.com", splMobile: "8428726958" },
  { splName: "Swathi N", splEmail: "swathi.pkn@gmail.com", splMobile: "7812875312" },
  { splName: "Shree Nithiya .k", splEmail: "nithiyashreek2004@gmail.com", splMobile: "8838844247" },
  { splName: "Raghuram Ravi", splEmail: "raghudae248@gmail.com", splMobile: "9080576226" },
  { splName: "Manikumar J", splEmail: "manikumarj6@gmail.com", splMobile: "" },
  { splName: "Thamizh Selvan R", splEmail: "thamizhselvan2803@gmail.com", splMobile: "" },
  { splName: "MALARAVAN P", splEmail: "malaravanofficial@gmail.com", splMobile: "" },
  { splName: "Jayasurya K", splEmail: "jai34563@gmail.com", splMobile: "" },
  { splName: "Dhanush ", splEmail: "dhanusharumugam245@gmail.com", splMobile: "" },
  { splName: "karthika", splEmail: "karthikakumar2026@gmail.com", splMobile: "" },
  { splName: "Arun A ", splEmail: "arunchris.postbox@gmail.com", splMobile: "" },
  { splName: "Asitha A", splEmail: "asithaa9613@gmail.com", splMobile: "" },
  { splName: "RAGUL T", splEmail: "ragul131121@gmail.com", splMobile: "" },
  { splName: "Saritha N", splEmail: "sarithasankari154@gmail.com", splMobile: "" },
  { splName: "Devanathan A", splEmail: "deva22ad@gmail.com", splMobile: "" },
  { splName: "BalaMugunthan", splEmail: "balasoftlogic12@gmail.com", splMobile: "" },
  { splName: "Ranjani Ram", splEmail: "ranjaniram81@gmail.com", splMobile: "" }
];

async function restoreSplProfiles() {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    let createdSplCount = 0;
    let updatedUserCount = 0;

    for (const splMatch of splMatches) {
        // Find their regular profile in Student collection
        let regularStudent = null;
        if (splMatch.splMobile) {
            regularStudent = await Student.findOne({ mobile: splMatch.splMobile, studentType: { $ne: 'SPL' } });
        }
        if (!regularStudent && splMatch.splEmail) {
            regularStudent = await Student.findOne({ email: splMatch.splEmail.toLowerCase().trim(), studentType: { $ne: 'SPL' } });
        }

        if (regularStudent) {
            // Check if they already have an SPL profile in Student collection to prevent duplicates
            let existingSpl = await Student.findOne({ email: regularStudent.email, studentType: 'SPL' });
            if (!existingSpl && regularStudent.mobile) {
                existingSpl = await Student.findOne({ mobile: regularStudent.mobile, studentType: 'SPL' });
            }

            let splStudentId = null;

            if (!existingSpl) {
                // Create a separate SPL profile in Student collection
                const splStudent = new Student({
                    name: splMatch.splName || regularStudent.name,
                    email: splMatch.splEmail || regularStudent.email,
                    mobile: splMatch.splMobile || regularStudent.mobile,
                    degree: regularStudent.degree || '',
                    passedOutYear: regularStudent.passedOutYear || '',
                    batch: regularStudent.batch || '',
                    grade: regularStudent.grade || '',
                    currentStatus: regularStudent.currentStatus || 'New',
                    studentType: 'SPL',
                    isFrontend: false,
                    willingCompanyProcess: true,
                    willing30Days: 'yes',
                    acceptOffer: 'yes',
                    fullEffort: 'yes',
                    resumeData: regularStudent.resumeData || {}
                });
                await splStudent.save();
                splStudentId = splStudent._id;
                createdSplCount++;
                console.log(`Created SPL profile for: "${splStudent.name}"`);
            } else {
                splStudentId = existingSpl._id;
                console.log(`SPL profile already exists for: "${existingSpl.name}"`);
            }

            // Link User account studentId to the SPL Student document so their login acts as an SPL Class user
            const user = await User.findOne({ email: (splMatch.splEmail || regularStudent.email).toLowerCase().trim() });
            if (user) {
                user.studentId = splStudentId;
                await user.save();
                updatedUserCount++;
                console.log(`Updated User login for ${user.email} to point to their SPL Profile ID.`);
            }
        } else {
            console.warn(`Could not find regular student data to copy for SPL: "${splMatch.splName}"`);
        }
    }

    console.log(`\nMigration completed successfully!`);
    console.log(`SPL profiles created: ${createdSplCount}`);
    console.log(`User accounts updated to SPL profile: ${updatedUserCount}`);

    await mongoose.disconnect();
}

restoreSplProfiles().catch(err => {
    console.error(err);
    process.exit(1);
});
