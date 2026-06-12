// src/db/seed.js - ข้อมูลจริงจาก PYLON_HR_v8.html
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// ===== ข้อมูลพนักงานทั้งหมดจากโปรแกรมเดิม =====
const EMPLOYEES = [
  // HQ
  {id:"320010",prefix:"นางสาว",fname:"มณีรัตน์",lname:"ลิ้มชัยเจริญ",dept:"บัญชีและการเงิน",pos:"เจ้าหน้าที่บัญชีอาวุโส",start:40345,grp:"hq"},
  {id:"350007",prefix:"นาย",fname:"ธวัชชัย",lname:"ศักดิ์ศรี",dept:"วิศวกรรม",pos:"Senior Structural Engineer",start:40200,grp:"hq"},
  {id:"330001",prefix:"นาย",fname:"กรณ์",lname:"ทองศรี",dept:"ทรัพยากรบุคคล",pos:"ผู้จัดการฝ่ายทรัพยากรบุคคล",start:38000,grp:"hq"},
  {id:"350001",prefix:"นาย",fname:"สุธี",lname:"นาคิน",dept:"วิศวกรรม",pos:"Design&Pre-construction Manager",start:41050,grp:"hq"},
  {id:"340004",prefix:"นางสาว",fname:"ศิรดา",lname:"บุญลือพันธ์",dept:"จัดซื้อ",pos:"เจ้าหน้าที่จัดซื้ออาวุโส",start:41288,grp:"hq"},
  {id:"320006",prefix:"นาง",fname:"พิมลพรรณ",lname:"นนทะโคตร",dept:"บัญชีและการเงิน",pos:"หัวหน้าส่วนการเงิน",start:41368,grp:"hq"},
  {id:"320001",prefix:"นาย",fname:"ชัยพล",lname:"สุทธมนัสวงษ์",dept:"บัญชีและการเงิน",pos:"EVP ฝ่ายบัญชีและการเงิน",start:38000,grp:"hq"},
  {id:"310005",prefix:"นาย",fname:"รัฐกร",lname:"พิมสาร",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"EVP ฝ่ายปฏิบัติการ",start:38500,grp:"hq"},
  {id:"360001",prefix:"นาย",fname:"อัฐกร",lname:"ทองถนอม",dept:"กลยุทธ์และกระบวนการ",pos:"EVP กลยุทธ์และกระบวนการ",start:38700,grp:"hq"},
  {id:"340002",prefix:"นางสาว",fname:"พีระญา",lname:"อมรศิลปพิทักษ์",dept:"จัดซื้อ",pos:"ผู้จัดการแผนกจัดชื้อ",start:42095,grp:"hq"},
  {id:"320011",prefix:"นางสาว",fname:"ชนันนัทธ์",lname:"จรอนันต์",dept:"บัญชีและการเงิน",pos:"เจ้าหน้าที่บัญชีอาวุโส",start:41624,grp:"hq"},
  {id:"320013",prefix:"นาย",fname:"สมพร",lname:"ทองดี",dept:"บัญชีและการเงิน",pos:"เจ้าหน้าที่บัญชี",start:41700,grp:"hq"},
  {id:"350002",prefix:"นางสาว",fname:"ณัฐพร",lname:"บุญประสิทธิ์",dept:"วิศวกรรม",pos:"Estimate Manager",start:42452,grp:"hq"},
  {id:"350009",prefix:"นาย",fname:"วิชัย",lname:"สมจิตร",dept:"วิศวกรรม",pos:"Senior Engineer",start:42500,grp:"hq"},
  {id:"350010",prefix:"นาย",fname:"ประสิทธิ์",lname:"มาลา",dept:"วิศวกรรม",pos:"Engineer",start:42600,grp:"hq"},
  {id:"360005",prefix:"นางสาว",fname:"วราพร",lname:"ดาวเรือง",dept:"กลยุทธ์และกระบวนการ",pos:"Process Manager",start:42700,grp:"hq"},
  {id:"350008",prefix:"นางสาว",fname:"สุภาภรณ์",lname:"กระชอนสุข",dept:"วิศวกรรม",pos:"เจ้าหน้าที่ธุรการ",start:43117,grp:"hq"},
  {id:"330006",prefix:"นาย",fname:"สมศักดิ์",lname:"วงษ์ดี",dept:"ทรัพยากรบุคคล",pos:"เจ้าหน้าที่บุคคล",start:43000,grp:"hq"},
  {id:"360004",prefix:"นางสาว",fname:"รัตติยา",lname:"เอกวงษา",dept:"กลยุทธ์และกระบวนการ",pos:"Asst.Process Manager",start:43374,grp:"hq"},
  {id:"320014",prefix:"นางสาว",fname:"สร้อยเพ็ชร์",lname:"ขำทอง",dept:"บัญชีและการเงิน",pos:"เจ้าหน้าที่บัญชีอาวุโส",start:43381,grp:"hq"},
  {id:"320003",prefix:"นาง",fname:"นงณภัส",lname:"โรจนบัณฑิต",dept:"บัญชีและการเงิน",pos:"ผู้อำนวยการฝ่ายบัญชี",start:39000,grp:"hq"},
  {id:"330010",prefix:"นางสาว",fname:"สุนันทา",lname:"นาคเสวก",dept:"ทรัพยากรบุคคล",pos:"หัวหน้าฝ่ายทรัพยากรบุคคล",start:43549,grp:"hq"},
  {id:"300001",prefix:"นาย",fname:"ชเนศวร์",lname:"แสงอารยะกุล",dept:"สำนักงานบริหาร (MD)",pos:"กรรมการผู้จัดการ",start:36000,grp:"hq"},
  {id:"310001",prefix:"นาย",fname:"รัฐกร",lname:"สมบัติ",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Senior Project Manager",start:38500,grp:"hq"},
  {id:"330003",prefix:"นาย",fname:"ไพรัตน์",lname:"กิจสุกราย",dept:"ทรัพยากรบุคคล",pos:"หัวหน้าแผนกธุรการ",start:37987,grp:"hq"},
  {id:"300002",prefix:"นาย",fname:"บดินทร์",lname:"แสงอารยะกุล",dept:"สำนักงานบริหาร (SEVP)",pos:"Senior EVP",start:37000,grp:"hq"},
  {id:"320004",prefix:"นาง",fname:"สุดารัตน์",lname:"พิมพ์สาลี",dept:"บัญชีและการเงิน",pos:"เจ้าหน้าที่บัญชีอาวุโส",start:39500,grp:"hq"},
  {id:"100001",prefix:"นาย",fname:"พิสันติ์",lname:"ศิริศุขสกุลชัย",dept:"วิศวกรรม + ไซท์ SE+",pos:"EVP ฝ่ายวิศวกรรม",start:37500,grp:"hq"},
  {id:"340001",prefix:"นาย",fname:"วีรทัศน์",lname:"จิรเดชวิโรจน์",dept:"จัดซื้อ",pos:"EVP ฝ่ายจัดซื้อ",start:38200,grp:"hq"},
  {id:"340003",prefix:"นางสาว",fname:"ภาชญา",lname:"มณีนพรัตน์",dept:"จัดซื้อ",pos:"เจ้าหน้าที่จัดซื้ออาวุโส",start:38986,grp:"hq"},
  {id:"320005",prefix:"นาง",fname:"ประนอม",lname:"สุขใจ",dept:"บัญชีและการเงิน",pos:"เจ้าหน้าที่บัญชี",start:39200,grp:"hq"},
  {id:"330002",prefix:"นาง",fname:"วารินทร์",lname:"แก้วสว่าง",dept:"ทรัพยากรบุคคล",pos:"เจ้าหน้าที่บุคคลอาวุโส",start:38100,grp:"hq"},
  {id:"310004",prefix:"นาย",fname:"สมบูรณ์",lname:"ชาติประยูร",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Project Manager",start:36500,grp:"hq"},
  {id:"320016",prefix:"ว่าที่ร้อยตรี",fname:"ดวงพร",lname:"คำเซอร์",dept:"บัญชีและการเงิน",pos:"เจ้าหน้าที่บัญชีอาวุโส",start:43718,grp:"hq"},
  {id:"330021",prefix:"นาย",fname:"ณรงค์ศักดิ์",lname:"สุริยะ",dept:"ทรัพยากรบุคคล",pos:"เจ้าหน้าที่บุคคล",start:43800,grp:"hq"},
  {id:"330022",prefix:"นางสาว",fname:"วัลภา",lname:"ช่องจอหอ",dept:"ทรัพยากรบุคคล",pos:"เจ้าหน้าที่บุคคล",start:45054,grp:"hq"},
  {id:"350019",prefix:"นาย",fname:"กฤษฎา",lname:"ลาภวัฒนา",dept:"วิศวกรรม",pos:"Engineer",start:45000,grp:"hq"},
  {id:"350022",prefix:"นาย",fname:"ชนะพล",lname:"วงศ์ประทีป",dept:"วิศวกรรม",pos:"Engineer",start:45100,grp:"hq"},
  {id:"350023",prefix:"นางสาว",fname:"อนัญลักษณ์",lname:"เจริญภักดี",dept:"วิศวกรรม",pos:"Asst.Estimate Manager",start:45083,grp:"hq"},
  {id:"360017",prefix:"นาย",fname:"พิชชา",lname:"หินคำ",dept:"กลยุทธ์และกระบวนการ",pos:"IT Manager",start:44886,grp:"hq"},
  {id:"340012",prefix:"นางสาว",fname:"พิชญ์วดี",lname:"หากิจจา",dept:"จัดซื้อ",pos:"Asst.Purchasing Manager",start:45278,grp:"hq"},
  {id:"360022",prefix:"นาย",fname:"วรากร",lname:"สุขสม",dept:"กลยุทธ์และกระบวนการ",pos:"IT Officer",start:45500,grp:"hq"},
  {id:"310031",prefix:"นาย",fname:"สมชาย",lname:"อินทร์ดี",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Project Engineer",start:45600,grp:"hq"},
  {id:"340013",prefix:"นางสาว",fname:"กัลยา",lname:"พรมมา",dept:"จัดซื้อ",pos:"เจ้าหน้าที่จัดซื้อ",start:45700,grp:"hq"},
  {id:"330027",prefix:"นาย",fname:"พัฒนพงษ์",lname:"อ่อนสี",dept:"ทรัพยากรบุคคล",pos:"เจ้าหน้าที่บุคคล",start:45800,grp:"hq"},
  {id:"320027",prefix:"นางสาว",fname:"กมลพร",lname:"อรุณ",dept:"บัญชีและการเงิน",pos:"เจ้าหน้าที่บัญชี",start:45867,grp:"hq"},
  {id:"320028",prefix:"นางสาว",fname:"สุนิสา",lname:"พุ่มกระจ่าง",dept:"บัญชีและการเงิน",pos:"เจ้าหน้าที่บัญชี",start:45889,grp:"hq"},
  {id:"360025",prefix:"นาย",fname:"ภานุวัฒน์",lname:"ดีศรี",dept:"กลยุทธ์และกระบวนการ",pos:"Process Officer",start:46000,grp:"hq"},
  {id:"360026",prefix:"นางสาว",fname:"มนัสนันท์",lname:"ศิริพันธ์",dept:"กลยุทธ์และกระบวนการ",pos:"Process Officer",start:46010,grp:"hq"},
  {id:"350025",prefix:"นาย",fname:"ปิยะ",lname:"มาลาวงศ์",dept:"วิศวกรรม",pos:"Engineer",start:46020,grp:"hq"},
  {id:"330028",prefix:"นางสาว",fname:"ธัญชนก",lname:"บุญมา",dept:"ทรัพยากรบุคคล",pos:"เจ้าหน้าที่บุคคล",start:46030,grp:"hq"},
  {id:"200001",prefix:"นาย",fname:"สมศักดิ์",lname:"วงษ์ตรี",dept:"โรงงาน",pos:"ผู้จัดการโรงงาน",start:36000,grp:"factory"},
  // Site
  {id:"110004",prefix:"นาย",fname:"วราพงศ์",lname:"ชฎารัตน์",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Senior Project Manager",start:41396,grp:"site"},
  {id:"110006",prefix:"นาย",fname:"จตุพงษ์",lname:"แสงทอง",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Project Manager",start:40478,grp:"site"},
  {id:"110009",prefix:"นาย",fname:"สมโชค",lname:"จุติมูสิก",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Project Manager",start:41232,grp:"site"},
  {id:"110010",prefix:"นาย",fname:"สหชาติ",lname:"ศรีเผด็จ",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Project Manager",start:43222,grp:"site"},
  {id:"110001",prefix:"นาย",fname:"รัฐกร",lname:"ชาติประยูร",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Senior Project Manager",start:38000,grp:"site"},
  {id:"110011",prefix:"นาย",fname:"สิทธิชัย",lname:"บุญมั่น",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Project Manager",start:43500,grp:"site"},
  {id:"110012",prefix:"นาย",fname:"อนุชา",lname:"สุขประเสริฐ",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Senior Engineer",start:43600,grp:"site"},
  {id:"110015",prefix:"นาย",fname:"ธนกฤต",lname:"พลอยดี",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Engineer",start:45000,grp:"site"},
  {id:"110017",prefix:"นาย",fname:"นัทธพงศ์",lname:"ชาญชัย",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Engineer",start:45100,grp:"site"},
  {id:"110025",prefix:"นาย",fname:"กิตติ",lname:"แก้วมณี",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Engineer",start:45200,grp:"site"},
  {id:"110027",prefix:"นาย",fname:"ปิยทัต",lname:"รุ่งโรจน์",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Engineer",start:45300,grp:"site"},
  {id:"110029",prefix:"นาย",fname:"วัชรพงษ์",lname:"มณีสวัสดิ์",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Engineer",start:45400,grp:"site"},
  {id:"110040",prefix:"นาย",fname:"ชัยยุทธ",lname:"สิงห์โต",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Senior Engineer",start:44000,grp:"site"},
  {id:"110044",prefix:"นาย",fname:"ณัฐพงษ์",lname:"แสงสว่าง",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Engineer",start:44500,grp:"site"},
  {id:"110045",prefix:"นาย",fname:"ทวีวัฒน์",lname:"ชื่นจิตต์",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Engineer",start:44600,grp:"site"},
  {id:"110046",prefix:"นาย",fname:"ธีรพัฒน์",lname:"พงษ์พิทักษ์",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Engineer",start:44700,grp:"site"},
  {id:"110052",prefix:"นาย",fname:"พงษ์ศักดิ์",lname:"ทองสุข",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Engineer",start:44800,grp:"site"},
  {id:"110053",prefix:"นาย",fname:"ภาณุพงศ์",lname:"ใจกล้า",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Engineer",start:46000,grp:"site"},
  {id:"110054",prefix:"นาย",fname:"มนตรี",lname:"วงศ์สุข",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Engineer",start:46010,grp:"site"},
  {id:"110055",prefix:"นาย",fname:"วิทยา",lname:"แก้วพรม",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Engineer",start:44900,grp:"site"},
  {id:"110056",prefix:"นาย",fname:"ศุภชัย",lname:"ทรัพย์ดี",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Engineer",start:46020,grp:"site"},
  {id:"110057",prefix:"นาย",fname:"สมปอง",lname:"พุทธา",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Engineer",start:46030,grp:"site"},
  {id:"110058",prefix:"นาย",fname:"สุทัศน์",lname:"ภูมิดี",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Engineer",start:46040,grp:"site"},
  {id:"110059",prefix:"นาย",fname:"อภิชาต",lname:"รัตนา",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Engineer",start:46050,grp:"site"},
  {id:"180007",prefix:"นางสาว",fname:"นุสรา",lname:"ดงรักษ์",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Safety Manager",start:41974,grp:"site"},
  {id:"180006",prefix:"นาย",fname:"ชาตรี",lname:"ทองไชย",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Safety Manager",start:42278,grp:"site"},
  {id:"180003",prefix:"นาย",fname:"ประเสริฐ",lname:"ยิ้มดี",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Safety Officer",start:43000,grp:"site"},
  {id:"180004",prefix:"นาย",fname:"พงษ์พัฒน์",lname:"สุวรรณ",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Safety Officer",start:43200,grp:"site"},
  {id:"180008",prefix:"นาย",fname:"สิทธิพร",lname:"กาญจน์",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Safety Officer",start:43300,grp:"site"},
  {id:"180011",prefix:"นางสาว",fname:"กมลวรรณ",lname:"พิมพ์ดี",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Safety Officer",start:44000,grp:"site"},
  {id:"180013",prefix:"นาย",fname:"ทนงศักดิ์",lname:"สุขใจ",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Safety Officer",start:44500,grp:"site"},
  {id:"180014",prefix:"นางสาว",fname:"ปนัดดา",lname:"รุ่งแสง",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Safety Officer",start:44600,grp:"site"},
  {id:"180026",prefix:"นาย",fname:"ยุทธนา",lname:"ตรีสุข",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Safety Officer",start:45000,grp:"site"},
  {id:"180031",prefix:"นาย",fname:"วิษณุ",lname:"มาลา",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Safety Officer",start:45500,grp:"site"},
  {id:"180032",prefix:"นางสาว",fname:"สุพรรณี",lname:"ดาวสม",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Safety Officer",start:45800,grp:"site"},
  {id:"180033",prefix:"นาย",fname:"อนุพงศ์",lname:"วรรณา",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Safety Officer",start:46000,grp:"site"},
  {id:"180001",prefix:"นาย",fname:"ปิยะ",lname:"สุขสันต์",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Safety Manager",start:40000,grp:"site"},
  {id:"130014",prefix:"นางสาว",fname:"เนตรนภา",lname:"ระวังกาย",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Senior Site Admin",start:43556,grp:"site"},
  {id:"130025",prefix:"นางสาว",fname:"อนุธิดา",lname:"ป้องสิงห์",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Site Admin",start:44621,grp:"site"},
  {id:"130026",prefix:"นางสาว",fname:"สุกัญญา",lname:"พันธ์ชัย",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Site Admin",start:44685,grp:"site"},
  {id:"130002",prefix:"นาย",fname:"ณภัทร",lname:"กิจภัทรสกุลชัย",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Site Admin",start:40581,grp:"site"},
  {id:"130003",prefix:"นางสาว",fname:"นันธญา",lname:"ภู่ระหงษ์",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Site Admin",start:39083,grp:"site"},
  {id:"130001",prefix:"นางสาว",fname:"อัญชลี",lname:"เต่าจันทร์",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Site Admin",start:39601,grp:"site"},
  {id:"130039",prefix:"นางสาว",fname:"รัญญาทิพย์",lname:"นิ่มพันธ์",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Site Admin.",start:45796,grp:"site"},
  {id:"130043",prefix:"นางสาว",fname:"ช่อเอื้อง",lname:"ทองสิน",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Site Admin.",start:45936,grp:"site"},
  {id:"130045",prefix:"นางสาว",fname:"สุทธิดา",lname:"ชัยพิมพา",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Site Admin.",start:46027,grp:"site"},
  {id:"130046",prefix:"นางสาว",fname:"ณภัทร",lname:"ถาวรวงษ์",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Site Admin.",start:46034,grp:"site"},
  {id:"130047",prefix:"นางสาว",fname:"พานทิวา",lname:"คำกูนา",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Site Admin.",start:46044,grp:"site"},
  {id:"130022",prefix:"นางสาว",fname:"พรทิพย์",lname:"แสงดาว",dept:"วิศวกรรม-หน่วยงานก่อสร้าง",pos:"Site Admin",start:44000,grp:"site"},
  // Factory (ตัวอย่าง)
  {id:"240121",prefix:"นาย",fname:"วิชาญ",lname:"จิตธิมล",dept:"โรงงาน",pos:"หัวหน้าช่างแมคคานิค",start:46027,grp:"factory"},
  {id:"240063",prefix:"นาย",fname:"อำนาจ",lname:"หอมดอกไม้",dept:"โรงงาน",pos:"หัวหน้าช่างยนต์",start:43587,grp:"factory"},
  {id:"260020",prefix:"นาย",fname:"สุรัตน์",lname:"คงเปลี่ยน",dept:"โรงงาน",pos:"หัวหน้าช่างระบบไฮดรอลิค",start:44684,grp:"factory"},
  {id:"240037",prefix:"นาย",fname:"ชราวุธ",lname:"กองปิ่น",dept:"โรงงาน",pos:"หัวหน้าช่างซ่อมยานยนต์",start:38718,grp:"factory"},
  {id:"250002",prefix:"นาย",fname:"กาหลง",lname:"ภู่ระหงษ์",dept:"โรงงาน",pos:"หัวหน้าชุดช่างเชื่อม",start:37987,grp:"factory"},
  {id:"260003",prefix:"นาย",fname:"ไพรินทร์",lname:"ชนะบุตร",dept:"โรงงาน",pos:"หัวหน้าชุดทั่วไป",start:41396,grp:"factory"},
  {id:"270041",prefix:"นาย",fname:"เอกภพ",lname:"เมืองมั่น",dept:"โรงงาน",pos:"หัวหน้าสโตร์",start:44627,grp:"factory"},
  {id:"240004",prefix:"นาย",fname:"ศุภเชษฐ์",lname:"อุคำ",dept:"โรงงาน",pos:"หัวหน้าแผนกทรัพย์สิน",start:38097,grp:"factory"},
  {id:"240001",prefix:"นาย",fname:"สมพงษ์",lname:"ทองอยู่",dept:"โรงงาน",pos:"ผู้จัดการฝ่ายโรงงาน",start:37000,grp:"factory"},
  {id:"260029",prefix:"นาย",fname:"สุเทพ",lname:"คล้ายบัญดิษฐ์",dept:"โรงงาน",pos:"หัวหน้าแผนกช่างเชื่อม",start:46027,grp:"factory"},
  {id:"270068",prefix:"นาย",fname:"อรุณ",lname:"สังข์วรรณะ",dept:"โรงงาน",pos:"หัวหน้าสโตร์",start:46027,grp:"factory"},
  {id:"220046",prefix:"นาง",fname:"สุวภัทร",lname:"บุตรโคตร",dept:"โรงงาน",pos:"เจ้าหน้าที่จัดซื้อ",start:46027,grp:"factory"},
  {id:"260030",prefix:"นาย",fname:"บุญส่ง",lname:"มิตธิรัตน์",dept:"โรงงาน",pos:"หัวหน้างานกลึง",start:46027,grp:"factory"},
];

// ===== ข้อมูลวันเกิดพนักงาน =====
const EMP_BDAYS = {"320010":"15051986","350007":"16121983","330001":"18021973","350001":"26111982","340004":"25051976","320006":"13041966","320001":"25021973","310005":"02091979","360001":"30091981","340002":"23021978","320011":"07031988","320013":"01121973","350002":"27051991","350009":"24021975","350010":"04041983","360005":"26041978","350008":"03081984","330006":"20111979","360004":"17021990","320014":"23091970","320003":"01111972","330010":"30041983","300001":"16031974","310001":"08061979","330003":"19011975","300002":"11111975","320004":"03101975","100001":"18091974","340001":"17031980","340003":"30051977","320005":"25071973","330002":"16011978","310004":"10061967","320016":"10041991","330021":"27071976","330022":"13121997","350019":"29011995","350022":"12101996","350023":"20032000","360017":"13021986","340012":"12021996","360022":"05091992","310031":"04071992","340013":"05111996","330027":"17061987","320027":"02101995","320028":"07032002","360025":"01101992","360026":"01031994","350025":"30121990","330028":"03122002","240121":"29011970","240005":"04061975","240037":"25081983","210004":"27101995","250002":"22021972","270005":"12061979","230001":"04021983","240008":"18041973","240001":"14041981","200001":"30011959","110004":"03081982","110006":"17031985","110009":"09111987","110010":"05081988","110001":"11011971","180007":"13111991","180006":"16121979","180001":"10071975","130014":"01091984","110029":"09021997","110044":"07071993","130025":"31031996","130026":"14071993","130002":"18011988","130003":"27051979","130001":"27051984","130039":"25011994","130043":"17011982","130045":"16121997","130046":"20071997","130047":"07091995","110011":"15101988","110012":"15031984","110015":"01091993","110017":"15121992","110025":"25051995","110027":"16111990","110040":"25031990","110045":"23041990","110046":"24021992","110052":"20121995","110053":"15092000","110054":"26062002","110055":"12122001","110056":"12122001","110057":"30052001","110058":"25122002","110059":"20061995","180003":"21101981","180004":"07021996","180008":"26071988","180011":"27031995","180013":"23061995","180014":"19031997","180026":"09101998","180031":"31082002","180032":"10111998","180033":"25022003","240063":"04031975","260020":"07091980","260003":"29111979","270041":"26091984","240004":"26041976","260029":"13111957","270068":"02021965","220046":"15041967","260030":"01011968","320016":"10041991","330021":"27071976"};

// ===== Users จากโปรแกรมเดิม =====
const USERS_DATA = [
  { username:'admin', password:'admin123', role:'admin', name:'ผู้ดูแลระบบ', emp_id:null, dept:null, exec_scope:'*', eval_emp_ids:'[]' },
  { username:'exec', password:'exec123', role:'executive', name:'ฝ่ายบริหาร', emp_id:null, dept:null, exec_scope:'*', eval_emp_ids:'[]' },
  { username:'300001', password:'exec_md', role:'executive', name:'ชเนศวร์ แสงอารยะกุล', emp_id:'300001', dept:null, exec_scope:'*', eval_emp_ids:'[]', read_only:true },
  { username:'300002', password:'eval_adm', role:'dual_exec', name:'บดินทร์ แสงอารยะกุล', emp_id:'300002', dept:'สำนักงานบริหาร (SEVP)', exec_scope:'*', eval_emp_ids:JSON.stringify(['300001','310005','360001','340001','320001','320003','330001','100001']) },
  { username:'100001', password:'eval_eng', role:'dual_exec', name:'พิสันติ์ ศิริศุขสกุลชัย', emp_id:'100001', dept:'วิศวกรรม + ไซท์ SE+', exec_scope:JSON.stringify(['วิศวกรรม','วิศวกรรม-หน่วยงานก่อสร้าง']), eval_emp_ids:JSON.stringify(['350001','350002','350007','350008','350009','350010','350019','350022','350023','350025','310001','310004','310005','310031','360001','360004','360005','360017','360022','360025','360026','110001','110004','110006','110009','110010','110011','110012','110015','110017','110025','110027','110029','110040','110044','110045','110046','110052','110053','110054','110055','110056','110057','110058','110059']) },
  { username:'330001', password:'eval_hr', role:'evaluator', name:'กรณ์ ทองศรี', emp_id:'330001', dept:'ทรัพยากรบุคคล', exec_scope:'ทรัพยากรบุคคล', eval_emp_ids:JSON.stringify(['330002','330003','330006','330010','330021','330022','330027','330028']) },
  { username:'320001', password:'eval_acc', role:'evaluator', name:'ชัยพล สุทธมนัสวงษ์', emp_id:'320001', dept:'บัญชีและการเงิน (EVP)', exec_scope:'บัญชีและการเงิน', eval_emp_ids:JSON.stringify(['320003','320004','320005','320006','320010','320011','320013','320014','320016','320027','320028']) },
  { username:'320003', password:'eval_acc2', role:'evaluator', name:'นงณภัส โรจนบัณฑิต', emp_id:'320003', dept:'บัญชี (ผอ.)', exec_scope:'บัญชีและการเงิน', eval_emp_ids:JSON.stringify(['320004','320005','320006','320010','320011','320013','320014','320016','320027','320028']) },
  { username:'340001', password:'eval_pur', role:'evaluator', name:'วีรทัศน์ จิรเดชวิโรจน์', emp_id:'340001', dept:'จัดซื้อ (EVP)', exec_scope:'จัดซื้อ', eval_emp_ids:JSON.stringify(['340002','340003','340004','340012','340013']) },
  { username:'360001', password:'eval_str', role:'evaluator', name:'อัฐกร ทองถนอม', emp_id:'360001', dept:'กลยุทธ์และกระบวนการ', exec_scope:'กลยุทธ์และกระบวนการ', eval_emp_ids:JSON.stringify(['360004','360005','360017','360022','360025','360026']) },
  { username:'350002', password:'eval_est', role:'evaluator', name:'ณัฐพร บุญประสิทธิ์', emp_id:'350002', dept:'Estimate', exec_scope:'วิศวกรรม', eval_emp_ids:JSON.stringify(['350001','350007','350008','350009','350010','350019','350022','350023','350025']) },
  { username:'200001', password:'eval_fac', role:'evaluator', name:'สมศักดิ์ วงษ์ตรี', emp_id:'200001', dept:'โรงงาน', exec_scope:'โรงงาน', eval_emp_ids:JSON.stringify(['240001','240004','240037','240063','240121','250002','260003','260020','260029','260030','270041','270068','220046']) },
  { username:'240001', password:'eval_fac2', role:'evaluator', name:'สมพงษ์ ทองอยู่', emp_id:'240001', dept:'โรงงาน', exec_scope:'โรงงาน', eval_emp_ids:JSON.stringify(['240004','240037','240063','240121','250002','260003','260020','260029','260030','270041','270068','220046']) },
  { username:'180007', password:'eval_saf', role:'evaluator', name:'นุสรา ดงรักษ์', emp_id:'180007', dept:'Safety', exec_scope:JSON.stringify(['วิศวกรรม-หน่วยงานก่อสร้าง']), eval_emp_ids:JSON.stringify(['180001','180003','180004','180006','180008','180011','180013','180014','180026','180031','180032','180033']) },
  { username:'110001', password:'eval_pm', role:'evaluator', name:'รัฐกร ชาติประยูร', emp_id:'110001', dept:'ไซท์', exec_scope:JSON.stringify(['วิศวกรรม-หน่วยงานก่อสร้าง']), eval_emp_ids:JSON.stringify(['110004','110006','110009','110010','110011','110012','110015','110017','110025','110027','110029','110040','110044','110045','110046','110052','110053','110054','110055','110056','110057','110058','110059','130001','130002','130003','130014','130022','130025','130026','130039','130043','130045','130046','130047']) },
];

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 เริ่ม Seed ข้อมูล...');

    // Insert employees
    console.log(`\n👥 กำลัง Insert พนักงาน ${EMPLOYEES.length} คน...`);
    for (const e of EMPLOYEES) {
      const bday = EMP_BDAYS[e.id] || null;
      await client.query(`
        INSERT INTO employees (id, prefix, fname, lname, dept, position, start_date, grp, bday)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (id) DO UPDATE SET
          prefix=$2, fname=$3, lname=$4, dept=$5, position=$6, start_date=$7, grp=$8, bday=$9
      `, [e.id, e.prefix, e.fname, e.lname, e.dept, e.pos, e.start, e.grp, bday]);
    }
    console.log('✅ พนักงานครบแล้ว');

    // Insert users
    console.log(`\n🔐 กำลัง Insert Users ${USERS_DATA.length} คน...`);
    for (const u of USERS_DATA) {
      const hashed = await bcrypt.hash(u.password, 10);
      await client.query(`
        INSERT INTO users (username, password, role, name, emp_id, dept, exec_scope, eval_emp_ids, read_only)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (username) DO UPDATE SET
          password=$2, role=$3, name=$4, emp_id=$5, dept=$6, exec_scope=$7, eval_emp_ids=$8, read_only=$9
      `, [u.username, hashed, u.role, u.name, u.emp_id||null, u.dept||null, u.exec_scope||'*', u.eval_emp_ids||'[]', u.read_only||false]);
    }
    console.log('✅ Users ครบแล้ว');

    const empCount = await client.query('SELECT COUNT(*) FROM employees');
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    console.log(`\n🎉 Seed เสร็จสมบูรณ์!`);
    console.log(`   พนักงาน: ${empCount.rows[0].count} คน`);
    console.log(`   Users:   ${userCount.rows[0].count} คน`);
  } catch(err) {
    console.error('❌ Seed error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
