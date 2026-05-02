<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\User;
use App\Models\Tontine;
use Illuminate\Support\Facades\Hash;

class TontineSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Créer des utilisateurs de test
        $admin = User::create([
            'name' => 'Admin Tontine',
            'email' => 'admin@tontine.com',
            'password' => Hash::make('password'),
        ]);

        for ($i = 1; $i <= 5; $i++) {
            User::create([
                'name' => "Membre $i",
                'email' => "membre$i@tontine.com",
                'password' => Hash::make('password'),
            ]);
        }

        // Créer une tontine de test
        $tontine = Tontine::create([
            'name' => 'Tontine Hackathon 2026',
            'description' => 'Démo pour TontineChain.',
            'contribution_amount' => 10000,
            'total_amount' => 60000,
            'frequency' => 'monthly',
            'max_members' => 6,
            'start_date' => now()->addDays(1),
            'status' => 'pending',
            'created_by' => $admin->id,
        ]);
        
        // Ajouter l'admin comme membre
        $tontine->members()->attach($admin->id, ['turn_order' => 1, 'status' => 'active']);
    }
}
