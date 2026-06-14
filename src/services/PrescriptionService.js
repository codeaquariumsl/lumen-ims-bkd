const PrescriptionRepository = require('../repositories/PrescriptionRepository');
const CustomerRepository = require('../repositories/CustomerRepository');
const CustomError = require('../utils/customError');

class PrescriptionService {
  async createPrescription(prescriptionData, user) {
    const { customerId, prescriptionDate } = prescriptionData;
    const branchId = user.branchId;

    if (!branchId) {
      throw new CustomError('User must be assigned to a branch to create prescriptions.', 400);
    }

    // Verify customer exists
    const customer = await CustomerRepository.findById(customerId);
    if (!customer) {
      throw new CustomError(`Customer with ID ${customerId} not found.`, 404);
    }

    const finalDate = prescriptionDate || new Date().toISOString().split('T')[0];
    
    // Default expiry is 1 year from prescription date
    const expDate = new Date(finalDate);
    expDate.setFullYear(expDate.getFullYear() + 1);
    const finalExpiryDate = expDate.toISOString().split('T')[0];

    const prescription = {
      branchId,
      optometristId: user.id,
      prescriptionDate: finalDate,
      expiryDate: finalExpiryDate,
      ...prescriptionData
    };

    return PrescriptionRepository.create(prescription);
  }

  async getPrescriptionById(id) {
    const prescription = await PrescriptionRepository.findById(id);
    if (!prescription) {
      throw new CustomError('Prescription not found.', 404);
    }
    return prescription;
  }

  async getAllPrescriptions(filters) {
    const page = parseInt(filters.page || '1');
    const limit = parseInt(filters.limit || '10');
    const offset = (page - 1) * limit;

    const { prescriptions, total } = await PrescriptionRepository.getAll({
      ...filters,
      limit,
      offset
    });

    const totalPages = Math.ceil(total / limit);

    return {
      prescriptions,
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages
      }
    };
  }

  async deletePrescription(id) {
    await this.getPrescriptionById(id);
    return PrescriptionRepository.delete(id);
  }
}

module.exports = new PrescriptionService();
