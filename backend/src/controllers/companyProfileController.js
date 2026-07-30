import {
  getCompanyProfileByUserId,
  upsertCompanyProfile,
  countCompletedProfiles,
} from '../models/companyProfileModel.js';

export const getMyCompanyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await getCompanyProfileByUserId(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profil perusahaan belum diisi',
      });
    }

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('getMyCompanyProfile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil profil perusahaan',
    });
  }
};

export const saveCompanyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      company_name,
      industry,
      company_size,
      city,
      phone_number,
      address,
      website,
    } = req.body;

    if (!company_name) {
      return res.status(400).json({
        success: false,
        message: 'Nama perusahaan wajib diisi',
      });
    }

    const profile = await upsertCompanyProfile(userId, {
      company_name,
      industry,
      company_size,
      city,
      phone_number,
      address,
      website,
    });

    return res.status(200).json({
      success: true,
      message: 'Profil perusahaan berhasil disimpan',
      data: profile,
    });
  } catch (error) {
    console.error('saveCompanyProfile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan profil perusahaan',
    });
  }
};

export const getCompletedProfileCount = async (req, res) => {
  try {
    const total = await countCompletedProfiles();
    return res.status(200).json({
      success: true,
      data: { total },
    });
  } catch (error) {
    console.error('getCompletedProfileCount error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil jumlah profil',
    });
  }
};