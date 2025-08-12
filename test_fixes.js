// Test script to verify the patientService fixes
// This file can be deleted after testing

import { fetchAllPatientNotes, fetchAllCallLogs } from '../services/patientService';

console.log('Testing patientService fixes...');

async function testFixes() {
    try {
        console.log('Testing fetchAllPatientNotes...');
        const notes = await fetchAllPatientNotes();
        console.log(`✅ fetchAllPatientNotes: Retrieved ${notes.length} notes`);
        
        console.log('Testing fetchAllCallLogs...');
        const callLogs = await fetchAllCallLogs(5);
        console.log(`✅ fetchAllCallLogs: Retrieved ${callLogs.length} call logs`);
        
        console.log('All tests passed! 🎉');
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testFixes();
